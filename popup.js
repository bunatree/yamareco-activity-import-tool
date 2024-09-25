document.addEventListener('DOMContentLoaded', async function() {

  // ブラウザーの言語設定を取得
  const userLang = navigator.language || navigator.userLanguage; // 'ja', 'en-US', etc.
  const lang = userLang.startsWith('ja') ? 'ja' : 'en';

  const dropAreaElm = document.getElementById('drop-area');
  
  i18nActivity(lang);
  i18nDropArea(lang);
  i18nButtons(lang);

  setupDismissAlert();

  // ヤマレコの山行記録作成/編集ページを開いているかチェック
  const yamarecoStep = await getYamarecoStep();

  if (yamarecoStep === -1) {

      showAlert('この拡張機能は、ヤマレコの山行記録作成/編集ページでのみ使用できます。','info',false);
      hideDropArea();
      hideActivity();
      hideButtonArea();
      setButtonStateAll([false,false,false]);

  } else {

    const activityData = await loadStoredData();

    if (activityData) {
      showActivity(activityData.date, activityData.title, 'info');
      setButtonsStatePerStep(yamarecoStep);
    } else {
      showDropArea();
      setButtonStateAll([false,false,false]);
    }  

  }

  dropAreaElm.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropAreaElm.classList.add('dragover');
  });

  dropAreaElm.addEventListener('dragleave', () => {
    dropAreaElm.classList.remove('dragover');
  });

  dropAreaElm.addEventListener('drop', (event) => {
    event.preventDefault();
    dropAreaElm.classList.remove('dragover');

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name !== 'activity.json') {
        showAlert('ドロップされたファイルはactivity.jsonではありません','warning',true);
        return;
      }
      readFile(file);
    }
  });

  document.getElementById('step1').addEventListener('click', function() {
    sendActionToTab('recordStep1');
  });

  document.getElementById('step2').addEventListener('click', function() {
    sendActionToTab('recordStep2');
  });

  document.getElementById('step4').addEventListener('click', function() {
    sendActionToTab('recordStep4');
  });

});

// Chromeのタブで開かれているURLから山行記録の作成/編集ページかどうか調べ、
// 該当する場合は山行記録作成のステップを調べる。
// 返り値 -1          ... 山行記録の作成/編集ページではない
//         1, 2, 3, 4 ... 山行記録の作成/編集ステップ番号
function getYamarecoStep() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {

      const currentTab = tabs[0];
      const url = new URL(currentTab.url);

      let step = -1;
      
      if (url.hostname.includes('yamareco.com') && url.pathname.includes('/modules/yamareco')) {
        // ヤマレコの山行記録作成/編集ページである
        if (url.pathname.includes('step1_create.php') || url.pathname.includes('step1_edit.php')) {
          step = 1;
        } else if (url.pathname.includes('step2_photo.php')) {
          step = 2;
        } else if (url.pathname.includes('step3_route.php')) {
          step = 3;
        } else if (url.pathname.includes('step4_imp.php')) {
          step = 4;
        } else if (url.pathname.includes('step5_open.php')) {
          step = 5;
        }
      } else {
        // ヤマレコの山行記録作成/編集ページではない
      }

      // -1 ... Not yamareco page
      // 1, 2, 3, 4, 5 ... Step number
      resolve(step);

    });
    
  });
}

async function readFile(file) {
  const reader = new FileReader();
  
  reader.onload = async function(event) {
    const content = event.target.result;

    // JSON形式かどうかを確認
    let jsonData;
    try {
      // JSON形式であればオブジェクトに変換
      jsonData = JSON.parse(content);
    } catch (error) {
      // 変換できなかった場合（つまりJSON形式でない場合）はエラーメッセージを表示
      showAlert('ファイルはJSON形式ではありません。','warning',true);
      return; // 処理を中断
    }

    showAlert('activity.json 読み込み完了','success',true);
    showActivity(jsonData.date, jsonData.title, 'info');
    hideDropArea();

    chrome.storage.local.set({ activityData: jsonData }, function() {
      console.log('Saved JSON data to the storage.');
    });

    const yamarecoStep = await getYamarecoStep();
    setButtonsStatePerStep(yamarecoStep);

  };

  reader.onerror = function() {
    showAlert('ファイルの読み込みに失敗しました。','warning',true);
  };

  // ファイルをテキストとして読み込む
  reader.readAsText(file);
}

function setButtonsStatePerStep(yamarecoStep) {
  switch (yamarecoStep) {
    case 1:
      setButtonStateAll([true,false,false]); // Enable button step1
      break;
    case 2:
      setButtonStateAll([false,true,false]); // Enable button step2
      break;
    case 4:
      setButtonStateAll([false,false,true]); // Enable button step4
      break;
  }
}

function setButtonStateAll(arrayState) {
  const arrayStep = [1,2,4];
  arrayStep.forEach((step, index) => {
    const buttonId = `step${step}`;
    const state = arrayState[index];
    setButtonState(buttonId, state);
  });
}

function setButtonState(buttonId,state) {
  const btnElm = document.getElementById(buttonId);
  const badgeElm = btnElm.querySelector('.badge');
  if (state) {
    btnElm.disabled = false;
    btnElm.classList.remove('btn-secondary');
    btnElm.classList.add('btn-primary');
    badgeElm.classList.remove('text-secondary');
    badgeElm.classList.add('text-primary');
  } else {
    btnElm.disabled = true;
    btnElm.classList.remove('btn-primary');
    btnElm.classList.add('btn-secondary');
    badgeElm.classList.remove('text-primary');
    badgeElm.classList.add('text-secondary');
  }
}

function sendActionToTab(action) {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.storage.local.get('activityData', function(result) {
      chrome.tabs.sendMessage(tabs[0].id, { action: action, data: result.activityData });
    });
  });
}

function showDropArea() {
  const dropAreaElm = document.getElementById('drop-area');
  dropAreaElm.classList.remove('d-none');
}

function hideDropArea() {
  const dropAreaElm = document.getElementById('drop-area');
  dropAreaElm.classList.add('d-none');
}

function showButtonArea() {
  const btnAreaElm = document.getElementById('button-area');
  btnAreaElm.classList.remove('d-none');
}

function hideButtonArea() {
  const btnAreaElm = document.getElementById('button-area');
  btnAreaElm.classList.add('d-none');
}

function showAlert(htmlContent, type, autoHide) {
  const alertDivElm = document.getElementById('alert');
  alertDivElm.classList.remove('d-none','alert-primary','alert-secondary','alert-success','alert-info','alert-warning');
  alertDivElm.classList.add('alert-' + type);
  alertDivElm.innerHTML = htmlContent;
  if (autoHide) {
    fadeOut(alertDivElm,2000);
  }
}

function showActivity(date, title, type) {
  const activityDivElm = document.getElementById('activity');
  activityDivElm.classList.remove('d-none','alert-primary','alert-secondary','alert-success','alert-info','alert-warning');
  activityDivElm.classList.add('alert-' + type);
  activityDivElm.querySelector('.date').textContent = date;
  activityDivElm.querySelector('.title').textContent = title;
}

function hideActivity() {
  const activityDivElm = document.getElementById('activity');
  activityDivElm.classList.add('d-none');
}

function fadeOut(elm,waitMs) {
  setTimeout(() => {
    elm.style.transition = 'opacity 1s';
    elm.style.opacity = '0';
    setTimeout(() => {
      elm.classList.add('d-none');
      elm.style.opacity = '1';
    }, 1000);
  }, waitMs);
}

function loadStoredData() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get('activityData', function(result) {
      const activityData = result.activityData;
      if (activityData && typeof activityData === 'object') {
        resolve(activityData);  // データがあればresolve
      } else {
        resolve(null);  // データがなければnullでresolve
      }
    });
  });
}

function setupDismissAlert() {
  const btnElm = document.querySelector('#activity .btn-close');
  btnElm.addEventListener('click', (event) => {
    chrome.storage.local.remove('activityData', function() {
      showAlert('データが削除されました', 'success', true);
      showDropArea();
      hideActivity();
      setButtonStateAll([false,false,false]); // 全ボタンをdisabled
    });
  });
}

function i18nButtons(lang) {
  const btn1Elm = document.getElementById('step1');
  const btn2Elm = document.getElementById('step2');
  const btn4Elm = document.getElementById('step4');
  btn1Elm.title = i18n[lang].btn_step1_title;
  btn1Elm.querySelector('.btn-label').textContent = i18n[lang].btn_step1_label;
  btn2Elm.title = i18n[lang].btn_step2_title;
  btn2Elm.querySelector('.btn-label').textContent = i18n[lang].btn_step2_label;
  btn4Elm.title = i18n[lang].btn_step4_title;
  btn4Elm.querySelector('.btn-label').textContent = i18n[lang].btn_step4_label;
}

function i18nDropArea(lang) {
  const dropAreaElm = document.getElementById('drop-area');
  dropAreaElm.querySelector('.msg').textContent = i18n[lang].drop_area_title;
  dropAreaElm.querySelector('.file-name').textContent = 'activity.json';
}

function i18nActivity(lang) {
  const closeElm = document.querySelector('#activity .btn-close');
  closeElm.title = i18n[lang].activity_close_title;
}