document.addEventListener('DOMContentLoaded', async function() {

  const dropAreaElm = document.getElementById('drop-area');
  const msgDivElm = document.getElementById('msg');
  const alertDivElm = document.getElementById('alert');

  // loadStoredDataを呼び出し、結果を待つ
  const activityData = await loadStoredData();
  // 保存済みactivityDataがある場合は、ファイルのドロップ領域を隠す
  if (activityData) {
    dropAreaElm.classList.add('d-none');
    const msgContent = '<div class="date">' + activityData.date + '</div>'
                     + '<div class="title">' + activityData.title + '</div>';
    showMsg(msgContent, 'info', false)
  }

  // 現在のアクティブタブのURLを取得
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const currentTab = tabs[0];
    const url = new URL(currentTab.url);

    // Enable/disable buttons based on the URL
    if (url.pathname.includes('step1_create.php') || url.pathname.includes('step1_edit.php')) {
      setButtonStateAll([true,false,false]); // Enable step1
    } else if (url.pathname.includes('step2_photo.php')) {
      setButtonStateAll([false,true,false]); // Enable step2
    } else if (url.pathname.includes('step4_imp.php')) {
      setButtonStateAll([false,false,true]); // Enable step4
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
  
    // 山行記録作成ページのstep1かどうかを確認
    if (url.hostname.includes('yamareco.com') && (url.pathname.includes('/step1_create.php') || url.pathname.includes('/step1_edit.php'))) {
      // ドラッグ＆ドロップ領域のメッセージを変更
      dropAreaElm.querySelector('p').textContent = 'activity.jsonをドラッグ＆ドロップしてください';
    } else {
      // 対応していないページの場合
      dropAreaElm.querySelector('p').textContent = 'この拡張機能は山行記録作成開始ページでのみ使用できます。';
    }
  });

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
    alertDivElm.textContent = ''; // メッセージをクリア

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
      alertDivElm.textContent = 'activity.json 読み込み完了';

      // 読み込んだ活動日記の概要などを表示
      showMsg('<div class="date">' + jsonData.date + '</div>' + '<div class="title">' + jsonData.title + '</div>', 'info', false)

      // ファイルのドロップエリアを非表示
      dropAreaElm.classList.add('d-none');

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

  function showAlert(htmlContent, type, autoHide) {
    alertDivElm.classList.remove('d-none','alert-primary','alert-secondary','alert-success','alert-info','alert-warning');
    alertDivElm.classList.add('alert-' + type);
    alertDivElm.innerHTML = htmlContent;
  }

  function showMsg(htmlContent, type, autoHide) {
    msgDivElm.classList.remove('d-none','alert-primary','alert-secondary','alert-success','alert-info','alert-warning');
    msgDivElm.classList.add('alert-' + type);
    msgDivElm.innerHTML = htmlContent;
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
  
  
});
