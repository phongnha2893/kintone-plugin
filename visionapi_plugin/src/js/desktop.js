jQuery.noConflict();
(function ($, PLUGIN_ID) {
  "use strict";

  const CLOUD_VISION_API_FEATURES_RESULT = {
    TEXT_DETECTION: ["textAnnotations", "fullTextAnnotation"],
    DOCUMENT_TEXT_DETECTION: ["fullTextAnnotation"],
    FACE_DETECTION: ["faceAnnotations"],
    LANDMARK_DETECTION: ["landmarkAnnotations"],
    LOGO_DETECTION: ["logoAnnotations"],
    LABEL_DETECTION: ["labelAnnotations"],
    SAFE_SEARCH_DETECTION: ["safeSearchAnnotation"],
    IMAGE_PROPERTIES: ["imagePropertiesAnnotation"],
    CROP_HINTS: ["cropHintsAnnotation"],
    WEB_DETECTION: ["webDetection"],
    PRODUCT_SEARCH: ["productSearchResults"],
    OBJECT_LOCALIZATION: ["localizedObjectAnnotations"],
  };

  const toastrOptions = {
    closeButton: true,
    debug: false,
    newestOnTop: true,
    progressBar: true,
    positionClass: "toast-top-center",
    preventDuplicates: true,
    onclick: null,
    showDuration: "300",
    hideDuration: "1000",
    timeOut: "5000",
    extendedTimeOut: "1000",
    showEasing: "swing",
    hideEasing: "linear",
    showMethod: "fadeIn",
    hideMethod: "fadeOut",
  };

  const showToasrtSuccess = function (title, msgContent, opt) {
    toastr.options = opt ? opt : toastrOptions;
    toastr.success(msgContent, title);
  };
  const showToasrtErrors = function (title, msgContent, opt) {
    toastr.options = opt ? opt : toastrOptions;
    //自動非表示：OFF
    toastr.options.extendedTimeOut = 0;
    toastr.options.timeOut = 0;
    toastr.options.tapToDismiss = false;
    toastr.error(msgContent, title);
  };

  kintone.events.on(["app.record.detail.show"], function (event) {
    //設定情報（config）の取得
    let config = kintone.plugin.app.getConfig(PLUGIN_ID);
    //base64変換
    let filekey = event.record[config.file_code].value[0].fileKey;
    let fileType = event.record[config.file_type_code].value;
    let feature = event.record[config.feature_code].value;
    if (!filekey) return;
    let url = kintone.api.urlForGet("/k/v1/file", { fileKey: filekey }, true);

    let fileBase64 = null;
    try {
      let xhr = new XMLHttpRequest();
      const fileReader = new FileReader();
      xhr.open("GET", url);
      xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
      xhr.responseType = "blob";
      xhr.onreadystatechange = function (event1) {
        if (xhr.readyState == 4 && xhr.status == 200) {
          fileReader.readAsDataURL(xhr.response);
          fileReader.onload = () => {
            fileBase64 = fileReader.result;
            fileBase64 = after_slice(fileBase64, "base64,");
          };
        }
      };
      xhr.send();
    } catch (err) {
      showToasrtErrors("kintoneファイルが読み込めません。", err.message || err.err);
    }
    //変換したbase64をCloud Vision APIへ送り、結果を受け取る。
    if (fileType && feature && feature.length > 0) {
      //ボタン作成

      if (document.getElementById("my_menu_button")) return;
      let myMenuButton = document.createElement("button");
      myMenuButton.id = "my_menu_button";
      myMenuButton.innerHTML = "検出";
      myMenuButton.style.color = "#ff0000";

      myMenuButton.onclick = function () {
        myMenuButton.disabled = true;
        myMenuButton.innerHTML = "検出中";

        let requestData;

        if (fileType == "画像") {
          requestData = {
            requests: [
              {
                image: {
                  content: fileBase64,
                },
                features: feature.map((f) => ({
                  type: f,
                  maxResults: 1000,
                })),
              },
            ],
          };
        } else {
          requestData = {
            requests: [
              {
                inputConfig: {
                  content: fileBase64,
                  mimeType: fileType == "PDF" ? "application/pdf" : "TIFF" ? "image/tiff" : "GIF" ? "image/gif" : "application/pdf",
                },
                features: feature.map((f) => ({
                  type: f,
                  maxResults: 1000,
                })),
              },
            ],
          };
        }

        let featureKeys = feature.reduce((agg, cur) => {
          let keys = CLOUD_VISION_API_FEATURES_RESULT[cur];
          for (let key of keys) {
            if (!agg.includes(key)) {
              agg.push(key);
            }
          }
          return agg;
        }, []);

        let recordId = event.record.$id.value;
        var proxyUrl =
          fileType == "画像" ? "https://vision.googleapis.com/v1/images:annotate?key=" : "https://vision.googleapis.com/v1/files:annotate?key=";
        var key = config.apikey;
        proxyUrl = proxyUrl + key;
        kintone.proxy(
          proxyUrl,
          "POST",
          { "Content-Type": "application/json" },
          requestData,
          function (body) {
            //結果をkintoneへ反映させる。
            let response = JSON.parse(body);
            response = response.responses[0];

            if (feature.every((f) => ["TEXT_DETECTION", "DOCUMENT_TEXT_DETECTION"].includes(f))) {
              if (fileType == "画像") {
                response = response.fullTextAnnotation.text;
              } else {
                response = response.responses;
                response = response.map((res) => res.fullTextAnnotation.text).join("\n");
              }
            } else {
              if (fileType == "画像") {
                for (let key in response) {
                  if (!featureKeys.includes(key)) {
                    delete response[key];
                  }
                }
              } else {
                response = response.responses;
                response = response.map((res) => {
                  for (let key in res) {
                    if (!featureKeys.includes(key)) {
                      delete res[key];
                    }
                  }
                  return res;
                });
              }

              response = JSON.stringify(response);
            }

            let body1detail = {};
            body1detail[config.result_code] = { value: response };
            let body1 = {
              app: kintone.app.getId(),
              id: recordId,
              record: body1detail,
            };
            kintone.api(
              kintone.api.url("/k/v1/record", true),
              "PUT",
              body1,
              function (resp) {
                showToasrtSuccess("検出成功", "結果が表示されます。");
                setTimeout(() => {
                  location.reload();
                }, 1500);
              },
              function (error) {
                console.log(error);
              }
            );
          },
          function (err) {
            showToasrtErrors("検出エラー", err.message || err.err);
            myMenuButton.disabled = false;
            myMenuButton.innerHTML = "検出";
          }
        );
      };
      kintone.app.record.getSpaceElement(config.space).appendChild(myMenuButton);
    }
    return event;
  });

  kintone.events.on(["app.record.detail.show", "app.record.create.show", "app.record.edit.show"], function (event) {
    //設定情報（config）の取得
    let config = kintone.plugin.app.getConfig(PLUGIN_ID);
    let feature = event.record[config.feature_code].value;
    let isOnlyTextDetectionFeature = feature && feature.every((f) => ["TEXT_DETECTION", "DOCUMENT_TEXT_DETECTION"].includes(f));
    if (!isOnlyTextDetectionFeature) {
      kintone.app.record.setFieldShown(config.result_code, false);
      let result = event.record[config.result_code].value;
      if (result) {
        let jsonDisplayElement = document.createElement("pre");
        let resultParsed = JSON.parse(result);
        jsonDisplayElement.innerHTML = JSON.stringify(resultParsed, undefined, 2);
        kintone.app.record.getSpaceElement(config.result_space).appendChild(jsonDisplayElement);
      }
    }

    return event;
  });
})(jQuery, kintone.$PLUGIN_ID);

//指定文字以降切り出し
function after_slice(str, word) {
  let index = str.indexOf(word);
  return str.slice(index + word.length);
}
