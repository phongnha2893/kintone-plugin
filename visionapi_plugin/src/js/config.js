jQuery.noConflict();

(function ($, PLUGIN_ID) {
  "use strict";
  // アプリのフォーム情報を取得
  let config = kintone.plugin.app.getConfig(PLUGIN_ID);
  let list = [];
  console.log(config);
  kintone.api(
    kintone.api.url("/k/v1/app/form/fields", true),
    "GET",
    {
      app: kintone.app.getId(),
    },
    function (resp) {
      for (var key in resp.properties) {
        if (!resp.properties.hasOwnProperty(key)) {
          continue;
        }
        var confFlg = false;
        var prop = resp.properties[key];
        var label = prop.label;
        var code = prop.code;

        list.push({ code: code, label: label });
        if (prop.type === "FILE") {
          if (typeof config.file_code !== "undefined" && code === config.file_code) {
            confFlg = true;
          }
          if (confFlg) {
            $("#file_code").prepend("<option name=" + code + " selected>" + label + "</option>");
          } else {
            $("#file_code").append("<option name=" + code + ">" + label + "</option>");
          }
        } else if (prop.type === "MULTI_LINE_TEXT") {
          if (typeof config.result_code !== "undefined" && code === config.result_code) {
            confFlg = true;
          }
          if (confFlg) {
            $("#result_code").prepend("<option name=" + code + " selected>" + label + "</option>");
          } else {
            $("#result_code").append("<option name=" + code + ">" + label + "</option>");
          }
        } else if (prop.type === "DROP_DOWN") {
          if (typeof config.file_type_code !== "undefined" && code === config.file_type_code) {
            confFlg = true;
          }

          if (confFlg) {
            $("#file_type_code").prepend("<option name=" + code + " selected>" + label + "</option>");
          } else {
            $("#file_type_code").append("<option name=" + code + ">" + label + "</option>");
          }
        } else if (prop.type === "MULTI_SELECT") {
          if (typeof config.feature !== "undefined" && code === config.feature) {
            confFlg = true;
          }

          if (confFlg) {
            $("#feature_code").prepend("<option name=" + code + " selected>" + label + "</option>");
          } else {
            $("#feature_code").append("<option name=" + code + ">" + label + "</option>");
          }
        }
      }
    }
  );
  var $form = $(".js-submit-settings");
  var $cancelButton = $(".js-cancel-button");
  var $apikey = $(".js-text-message-api");
  var $space = $(".js-text-message-space");
  var $resultSpace = $(".js-result-space");

  if (config.apikey) {
    $apikey.val(config.apikey);
  }
  if (config.space) {
    $space.val(config.space);
  }
  if (config.result_space) {
    $resultSpace.val(config.result_space);
  }
  $form.on("submit", function (e) {
    e.preventDefault();

    let file_code = $("[id = file_code] :selected").val();
    let result_code = $("[id = result_code] :selected").val();
    let file_type_code = $("[id = file_type_code] :selected").val();
    let feature_code = $("[id = feature_code] :selected").val();

    for (var i = 0; i < list.length; i++) {
      if (file_code == list[i].label) {
        file_code = list[i].code;
      } else if (result_code == list[i].label) {
        result_code = list[i].code;
      } else if (file_type_code == list[i].label) {
        file_type_code = list[i].code;
      } else if (feature_code == list[i].label) {
        feature_code = list[i].code;
      }
    }
    kintone.plugin.app.setConfig(
      {
        apikey: $apikey.val(),
        space: $space.val(),
        file_code: file_code,
        result_code: result_code,
        file_type_code: file_type_code,
        feature_code: feature_code,
        result_space: $resultSpace.val(),
      },
      function () {
        alert("設定内容を保存しました。必ずアプリを更新してください。");
        window.location.href = "../../flow?app=" + kintone.app.getId();
      }
    );
  });
  $cancelButton.on("click", function () {
    window.location.href = "../../" + kintone.app.getId() + "/plugin/";
  });
})(jQuery, kintone.$PLUGIN_ID);
