document.addEventListener('DOMContentLoaded', async function() {

  const dropAreaElm = document.getElementById('drop-area');
  dropAreaElm.querySelector('.msg').textContent = 'ドラッグ＆ドロップ';
  dropAreaElm.querySelector('.file-name').textContent = 'activity.json';

  setupActivityTrash();

  // loadStoredDataを呼び出し、結果を待つ
  const activityData = await loadStoredData();

  if (activityData) {
    // 保存済みactivityDataがある場合
    console.log('Yes! Loading activityData...');
    showActivity(activityData.date, activityData.title, 'info');
  } else {
    // 保存済みactivityDataがない場合
    console.log('No activityData. Let the user upload activity.json.');
    showDropArea();
  }  

  // 現在のアクティブタブのURLを取得
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const currentTab = tabs[0];
    const url = new URL(currentTab.url);

    if (!url.hostname.includes('yamareco.com') && !url.pathname.includes('/modules/yamareco')) {
      showAlert('この拡張機能は、ヤマレコの山行記録作成/編集ページでのみ使用できます。','info',false);
      hideDropArea();
    }

    // Enable/disable buttons based on the URL
    if (url.pathname.includes('step1_create.php') || url.pathname.includes('step1_edit.php')) {
      setButtonStateAll([true,false,false]); // Enable step1
    } else if (url.pathname.includes('step2_photo.php')) {
      setButtonStateAll([false,true,false]); // Enable step2
    } else if (url.pathname.includes('step4_imp.php')) {
      setButtonStateAll([false,false,true]); // Enable step4
    }  
  });

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
    if (state) {
      btnElm.disabled = false;
      btnElm.classList.remove('btn-secondary');
      btnElm.classList.add('btn-primary');
    } else {
      btnElm.disabled = true;
      btnElm.classList.remove('btn-primary');
      btnElm.classList.add('btn-secondary');
    }
  }

  // ドラッグオーバー時にスタイルを変更
  dropAreaElm.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropAreaElm.classList.add('dragover');
  });

  // ドラッグが終了したらスタイルを戻す
  dropAreaElm.addEventListener('dragleave', () => {
    dropAreaElm.classList.remove('dragover');
  });

  // ドロップされたときの処理
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

  // ファイルを読み込む
  function readFile(file) {
    const reader = new FileReader();
    
    reader.onload = function(event) {
      const content = event.target.result;
  
      // JSON形式かどうかを確認するためのトライキャッチブロック
      let jsonData;
      try {
        // JSON形式であればオブジェクトに変換
        jsonData = JSON.parse(content);
      } catch (error) {
        // 変換できなかった場合（つまりJSON形式でない場合）はエラーメッセージを表示
        showAlert('ファイルはJSON形式ではありません。','warning',true);
        return; // 処理を中断
      }
  
      // 正常に読み込めた(^^)
      showAlert('activity.json 読み込み完了','success',true);

      // 読み込んだ活動日記の概要などを表示
      showActivity(jsonData.date, jsonData.title, 'info');

      // ファイルのドロップエリアを非表示
      hideDropArea();

      // ボタンエリアを表示
      const btnAreaElm = document.getElementById('button-area');
      btnAreaElm.classList.remove('d-none');
  
      // 念のため、今後の処理のためにデータを保存する
      chrome.storage.local.set({ activityData: jsonData }, function() {
        console.log('データが保存されました');
      });
  
      // 現在のタブにデータを送信する
      // chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      //   chrome.tabs.sendMessage(tabs[0].id, { action: 'importActivityData', data: jsonData });
      // });
    };
  
    reader.onerror = function() {
      showAlert('ファイルの読み込みに失敗しました。','warning',true);
    };
  
    // ファイルをテキストとして読み込む
    reader.readAsText(file);
  }

  // ボタンがクリックされたときの動作
  document.getElementById('step1').addEventListener('click', function() {
    console.log("You clicked button step1!");
    sendActionToTab('recordStep1');
  });

  document.getElementById('step2').addEventListener('click', function() {
    console.log("You clicked button step2!");
    sendActionToTab('recordStep2');
  });

  document.getElementById('step4').addEventListener('click', function() {
    console.log("You clicked button step4!");
    sendActionToTab('recordStep4');
  });

  function sendActionToTab(action) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.storage.local.get('activityData', function(result) {
        chrome.tabs.sendMessage(tabs[0].id, { action: action, data: result.activityData });
      });
    });
  }

  function showDropArea() {
    dropAreaElm.classList.remove('d-none');
  }

  function hideDropArea() {
    dropAreaElm.classList.add('d-none');
  }

  function showAlert(htmlContent, type, autoHide) {
    const alertDivElm = document.getElementById('alert');
    alertDivElm.classList.remove('d-none','alert-primary','alert-secondary','alert-success','alert-info','alert-warning');
    alertDivElm.classList.add('alert-' + type);
    alertDivElm.innerHTML = htmlContent;
    if (autoHide) {
      fadeOut(alertDivElm,1500);
    }
  }

  function showActivity(date, title, type) {
    console.log(`showActivity `);
    const activityDivElm = document.getElementById('activity');
    activityDivElm.classList.remove('d-none','alert-primary','alert-secondary','alert-success','alert-info','alert-warning');
    activityDivElm.classList.add('alert-' + type);
    activityDivElm.querySelector('.date').textContent = date;
    activityDivElm.querySelector('.title').textContent = title;
  }

  function hideActivity() {
    console.log('hideActivity')
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
  
  function setupActivityTrash() {
    const trashIconElm = document.querySelector('#activity .trash i');
    trashIconElm.addEventListener('click', (event) => {
      chrome.storage.local.remove('activityData', function() {
        showAlert('データが削除されました', 'success', true);
        showDropArea();
        hideActivity();
      });
    });
  }
  
});
