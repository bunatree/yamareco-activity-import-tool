document.addEventListener('DOMContentLoaded', function() {

  const dropAreaElm = document.getElementById('drop-area');
  const msgDivElm = document.getElementById('msg');

  // 現在のアクティブタブのURLを取得
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const currentTab = tabs[0];

    const url = new URL(currentTab.url);


    console.dir({url})
    // Enable/disable buttons based on the URL
    if (url.pathname.includes('step1_create.php') || url.pathname.includes('step1_edit.php')) {
      setButtonState('step1',true);
      setButtonState('step2',false);
      setButtonState('step4',false);
    } else if (url.pathname.includes('step2_photo.php')) {
      setButtonState('step1',false);
      setButtonState('step2',true);
      setButtonState('step4',false);
    } else if (url.pathname.includes('step4_imp.php')) {
      setButtonState('step1',false);
      setButtonState('step2',false);
      setButtonState('step4',true);
    }

    function setButtonState(buttonId,state) {
      console.log('enableButton ' + buttonId + ' ' + state);
      const btnElm = document.getElementById(buttonId);
      if (state) {
        btnElm.disabled = false;
        btnElm.classList.remove('btn-secondary');
        btnElm.classList.add('btn-primary');
        // btnElm.style.opacity = 1;
      } else {
        btnElm.disabled = true;
        btnElm.classList.remove('btn-primary');
        btnElm.classList.add('btn-secondary');
        // btnElm.style.opacity = 0.5;
      }
    }
  
    function disableButton(buttonId) {
      console.log('disableButton ' + buttonId);
        const button = document.getElementById(buttonId);
        button.disabled = true;
        button.style.opacity = 0.5;
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
    msgDivElm.textContent = ''; // メッセージをクリア

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name !== 'activity.json') {
        msgDivElm.textContent = 'ドロップされたファイルはactivity.jsonではありません';
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
        msgDivElm.textContent = 'ファイルはJSON形式ではありません。';
        return; // 処理を中断
      }
  
      // 正常に読み込めた(^^)
      msgDivElm.textContent = 'activity.jsonを正常に読み込みました。';
      msgDivElm.classList.remove('d-none');
      msgDivElm.classList.add('alert-success','d-block');

      // ファイルのドロップエリアを非表示
      const dropAreaElm = document.getElementById('drop-area');
      dropAreaElm.classList.add('d-none');

      // ボタンエリアを表示
      const btnAreaElm = document.getElementById('button-area');
      btnAreaElm.classList.remove('d-none');
  
      // 念のため、今後の処理のためにデータを保存する
      chrome.storage.local.set({ activityData: jsonData }, function() {
        console.log('データが保存されました');
      });
  
      // 現在のタブにデータを送信する
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'importActivityData', data: jsonData });
      });
    };
  
    reader.onerror = function() {
      msgDivElm.textContent = 'ファイルの読み込みに失敗しました。';
    };
  
    // ファイルをテキストとして読み込む
    reader.readAsText(file);
  }

  // ボタンがクリックされたときの動作
  document.getElementById('step1').addEventListener('click', function() {
    sendActionToTab('recordStep1');
  });

  document.getElementById('step2').addEventListener('click', function() {
      sendActionToTab('recordStep2');
  });

  document.getElementById('step4').addEventListener('click', function() {
      sendActionToTab('recordStep4');
  });

  function sendActionToTab(action) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.storage.local.get('activityData', function(result) {
            chrome.tabs.sendMessage(tabs[0].id, { action: action, data: result.activityData });
        });
    });
  }


  
  
});
