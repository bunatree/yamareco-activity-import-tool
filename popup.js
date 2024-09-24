document.addEventListener('DOMContentLoaded', async function() {

  const dropAreaElm = document.getElementById('drop-area');
  const msgDivElm = document.getElementById('msg');
  const alertDivElm = document.getElementById('alert');

  // loadStoredDataを呼び出し、結果を待つ
  const activityData = await loadStoredData();
  // 保存済みactivityDataがある場合は、ファイルのドロップ領域を隠す
  if (activityData) {
    dropAreaElm.classList.add('d-none');
    const msgContent = '<div class="d-flex">'
                     + '<div class="summary overflow-hidden">'
                     + '<div class="date">' + activityData.date + '</div>'
                     + '<div class="title">' + activityData.title + '</div>'
                     + '</div>'
                     + '<div class="trash">'
                     + '<a href="javascript:void(0);" title="読み込み済みデータをクリアする"><i class="bi bi-trash"></i></a>'
                     + '</div>'
                     + '</div>';
    showMsg(msgContent, 'info', false);
    const trashAnchorElm = document.querySelector('#msg .trash a');
    trashAnchorElm.addEventListener('click', (event) => {
      // ストレージからデータを削除
      chrome.storage.local.remove('activityData', function() {
        console.log('保存されていたデータが削除されました');
        
        // メッセージとUIをリセット
        showMsg('データが削除されました', 'success', true);
        
        // ファイルドロップ領域を再表示
        dropAreaElm.classList.remove('d-none');
      });
    });
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
  
    // 山行記録作成ページかどうかをチェック
    if (url.hostname.includes('yamareco.com') && (url.pathname.includes('/modules/yamareco'))) {
      dropAreaElm.querySelector('.msg-container .msg').textContent = 'ドラッグ＆ドロップ';
      dropAreaElm.querySelector('.msg-container .file-name').textContent = 'activity.json';
      showDropArea();
    } else {
      showAlert('この拡張機能は、ヤマレコの山行記録作成/編集ページでのみ使用できます。','info',false);
      hideDropArea();
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
    alertDivElm.classList.remove('d-none','alert-primary','alert-secondary','alert-success','alert-info','alert-warning');
    alertDivElm.classList.add('alert-' + type);
    alertDivElm.innerHTML = htmlContent;
    if (autoHide) {
      fadeOut(alertDivElm,1500,1000);
    }
  }

  function showMsg(htmlContent, type, autoHide) {
    msgDivElm.classList.remove('d-none','alert-primary','alert-secondary','alert-success','alert-info','alert-warning');
    msgDivElm.classList.add('alert-' + type);
    msgDivElm.innerHTML = htmlContent;
    if (autoHide) {
      fadeOut(msgDivElm,1500,1000);
    }
  }

  function fadeOut(elm,waitMs,processMs) {
    setTimeout(() => {
      // フェードアウト処理
      elm.style.transition = 'opacity 1s';  // フェードアウトのためのトランジション
      elm.style.opacity = '0';  // 完全に透明にする

      // フェードアウト完了後に非表示にする
      setTimeout(() => {
        elm.classList.add('d-none');  // 完全に消す
        elm.style.opacity = '1';  // 次に使うときのために透明度をリセット
      }, processMs);  // 1秒後に非表示に
    }, waitMs);  // メッセージが表示されてから1.5秒後にフェードアウトを開始
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
