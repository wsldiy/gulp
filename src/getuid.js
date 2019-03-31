// var baseUrl = 'https://nobug.doumob.cn/appserver/';
var baseUrl = 'https://api.clotfun.online/'
var openDate = Date.now();
function getUrlParam(name) {
  var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
  var r = window.location.search.substr(1).match(reg);
  if (r != null) return decodeURIComponent(r[2]);
  return null;
}

var setCookie = function (name, value) {
  var Days = 7;
  var exp = new Date();
  exp.setTime(exp.getTime() + Days * 24 * 60 * 60 * 1000);
  document.cookie = name + "=" + encodeURIComponent(value) + ";expires=" + exp.toGMTString();
}
var getCookie = function (name) {
  var arr, reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
  if (arr = document.cookie.match(reg)) {
    return decodeURIComponent(arr[2]);
  } else {
    return null;
  }
}

var options = {};
var cookie_uid = getCookie('hdgg_uid');
// var latitude = '',
//     longitude = '';
// if (navigator.geolocation) {
//   navigator.geolocation.getCurrentPosition(function (position) {
//     latitude = position.coords.latitude;
//     longitude = position.coords.longitude
//   })
// } else {
//   alert('你的浏览器不支持当前地理位置信息获取')
// }

function setupWebViewJavascriptBridge(callback) {
  if (window.WebViewJavascriptBridge) {
    return callback(WebViewJavascriptBridge);
  }
  if (window.WVJBCallbacks) {
    return window.WVJBCallbacks.push(callback);
  }
  window.WVJBCallbacks = [callback];
  var WVJBIframe = document.createElement('iframe');
  WVJBIframe.style.display = 'none';
  WVJBIframe.src = 'https://__bridge_loaded__';
  document.documentElement.appendChild(WVJBIframe);
  setTimeout(function () {
    document.documentElement.removeChild(WVJBIframe)
  }, 0)
}

var params = {};
var u = navigator.userAgent, app = navigator.appVersion;
var isAndroid = u.indexOf('Android') > -1 || u.indexOf('Linux') > -1; //g
var isIOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端
var iosSdk = '', androidSdk = '';
var videoList = {}, shareUrl = '';
var flag = true;
var player, player2, player3, player4, playing;
if (isAndroid) {
  try {
    window.android.onPostSystemType();

    function onGetSystemType(param) {
      console.log('sdk类型获取成功，回传成功信息', param);
      androidSdk = param;
      if (!!androidSdk) {
        //安卓调用js（初始化接受来自安卓的传消息）
        if (!cookie_uid) {
          try {
            window.android.onPostDeviceInfo();
          } catch (err) {
            console.log(err);
          }

        } else {
          entrance();
        }
      }
    }
  } catch (err) {
    console.log(err);
    getUid();
  }

  function onGetDeviceInfo(param) {
    console.log('被安卓调用成功，请给我设备信息', param);
    params = param;
    if (params.uid) {
      cookie_uid = params.uid;
      entrance();
    } else {
      getAndroidUid(params)
    }
  }

  //安卓分享成功回传
  function onShareComplete(param) {
    console.log('分享成功，回传成功信息', param);
    // alert('分享成功，回传成功信息')
  }

  //安卓开始下载成功回传
  function onStartDownload(param) {
    console.log('开始下载，回传成功信息', param);
  }

  //安卓下载成功回传
  function onDownloadSuccess(param) {
    console.log('下载成功，回传成功信息', param);
  }
} else if (isIOS && u.indexOf('iosSdk') > -1) {
  console.log('获取ios请求的userAgent', u);
  iosSdk = 'iosSdk';
  getIosUid()
} else {
  getUid();
}

function getAndroidUid(params) {
  options = {
    "deviceId": params.deviceId,
    "imsi": params.imsi,
    "mobile": params.phoneNumber || "",
    "model": params.model,
    "brand": params.brand,
    "packageName": params.package,
    "platform": params.system,
    "screen": params.screen
  };
  $.ajax({
    type: "POST",
    url: baseUrl + 'device/getUid',
    data: JSON.stringify(options),
    async: false,
    headers: {'Content-Type': 'application/json;charset=utf8'},
    success: function (res) {
      console.log('获取uid,要传给安卓');
      cookie_uid = res.result;
      setCookie('hdgg_uid', cookie_uid);
      //传给安卓uid
      console.log('cookieUID', cookie_uid);
      window.android.onSaveUid(cookie_uid);
      entrance();
    }
  });
}

//ios下sdk
function getIosUid() {
  if (!cookie_uid) {
    //oc调用js方法
    setupWebViewJavascriptBridge(function (bridge) {
      // bridge.registerHandler('onGetDeviceInfo', function (data, responseCallback) {
      //   console.log('oc调用js回传参数', data);
      // });
      //js调用ios（初始化给ios传消息并接收信息）
      bridge.callHandler('onPostDeviceInfo', function (response) {
        console.log('收到oc传过来的设备信息:' + JSON.stringify(response));
        var params = response;
        if (params.uid) {
          cookie_uid = params.uid;
          entrance();
        } else {
          options = {
            "deviceId": params.deviceId,
            "imsi": params.imsi,
            "mobile": params.phoneNumber || "",
            "model": params.model,
            "brand": params.brand,
            "packageName": params.package,
            "platform": params.system,
            "screen": params.screen
          };
          $.ajax({
            type: "POST",
            url: baseUrl + 'device/getUid',
            data: JSON.stringify(options),
            async: false,
            headers: {'Content-Type': 'application/json;charset=utf8'},
            success: function (res) {
              console.log('获取uid', res);
              cookie_uid = res.result;
              setCookie('hdgg_uid', cookie_uid);
              entrance();
              //传给ios的uid
              bridge.callHandler('onSaveUid', {
                uid: cookie_uid
              }, function (response) {
                //处理oc过来的回调
                console.log('传给iosUid后的返回信息:' + JSON.stringify(response))
              })
            }
          });
        }
      });
    });
  } else {
    entrance()
  }
}

function getUid() {
  if (!cookie_uid) {
    options = {
      "deviceId": '',
      "imsi": '',
      "mobile": "",
      "model": '',
      "brand": '',
      "packageName": '',
      "platform": '',
      "screen": ''
    };
    $.ajax({
      type: "POST",
      url: baseUrl + 'device/getUid',
      data: JSON.stringify(options),
      async: false,
      headers: {'Content-Type': 'application/json;charset=utf8'},
      success: function (res) {
        //H5自己请求uid
        console.log('获取uid', res);
        if (res.code == 200) {
          cookie_uid = res.result;
          setCookie('hdgg_uid', cookie_uid);
          entrance();
        }
      }
    });
  } else {
    entrance();
  }
}

function entrance() {
  //广告入口 获取互动广告信息
  var options2 = {
    appkey: getUrlParam('appkey'),
    adSpaceKey: getUrlParam('adSpaceKey'),
    mobileSystem: 1,
    promotionNetwork: 1,
    uid: cookie_uid
  };
  $.ajax({
    type: "POST",
    url: baseUrl + 'entrance',
    data: JSON.stringify(options2),
    async: false,
    headers: {'Content-Type': 'application/json'},
    success: function (res) {
      console.log('广告入口', res)
      if (res.code == 0) {
        if (!!res.data) {
          videoList = res.data;
          $('body').addClass('videoBg').css('background-image', 'url(' + videoList.videoInfoList[0].firstFrame + ')');
          boFang();
        } else {
          window.location.href = res.url
        }
      }
    }
  });
}

//关闭
window.styleReset = function () {
  $('#hdgg_show-win-custom-pdd').addClass('hidem');
  $('#hdgg_show-win-custom-pdd').remove();
  flag = true;
  $('#redBag,#endChoice').show();
};

//安卓4.4有问题的声明
// var AudioContext = window.AudioContext || window.webkitAudioContext;
// var context = new AudioContext();
// var playTwice = 1;

function play() {
  // console.log('wsl', playing.audioOut.context.state)
  var audio = playing.audioOut //每一个都会有关联一个JSMpeg.AudioOutput.WebAudio
  // if (playing.audioOut.context.state === 'suspended') {
  audio.unlock(); // 这个不一定生效
  // }
  playing.play();
}

function voiceAlarm(currentPlayer) {
  var audio = currentPlayer.audioOut; //每一个都会有关联一个JSMpeg.AudioOutput.WebAudio
  // audio.unlock();
  console.log(currentPlayer.audioOut.context.state, audio.volume, currentPlayer.audioOut.unlocked)
  if (currentPlayer.audioOut.context.state === 'suspended' || audio.volume === 0 || !currentPlayer.audioOut.unlocked) {
    $('#openCloseMuted').removeClass('openAudio')
    audio.volume = 0;
  } else {
    $('#openCloseMuted').addClass('openAudio')// audio.volume = 1;
  }

}

function switch2() {
  var audio = playing.audioOut; //每一个都会有关联一个JSMpeg.AudioOutput.WebAudio
  // if (playing.audioOut.context.state === 'suspended') {
  audio.unlock();
  // }
  //如果当前无声
  if (audio.volume === 0) {
    audio.volume = 1;
    $('#openCloseMuted').addClass('openAudio')
  } else if (audio.volume > 0) {
    audio.volume = 0;
    $('#openCloseMuted').removeClass('openAudio')
  }
}

//播放问题
function boFang() {
  if (JSON.stringify(videoList) != '{}') {
    player = new JSMpeg.Player(videoList.videoInfoList[0].playURL, {
      autoplay: true,
      disableGl: true,
      disableWebAssembly: true,
      loop: false,
      progressive: true,
      chunkSize: 512 * 1024,
      // poster: 'https://video.bayimob.com/interactive/d045ef12aafb4a549e856ef738685ffb/6434f571-7f33-4622-8fd3-e6b4eb67be12.jpg',
      canvas: document.querySelector('#canvas'),
      onPlay: function () {
        $('#canvas').show();
        voiceAlarm(player);
        $('body').removeClass('videoBg').css('background-color', '#000').css('background-image', 'url()');
        console.log('页面加载到播放成功ms数', Date.now() - openDate)
        $('#openCloseMuted').show();
        //视频播放页 加载成功 汇报展示
        var options3 = {
          appkey: getUrlParam('appkey'),
          adSpaceKey: getUrlParam('adSpaceKey'),
          mobileSystem: 1,
          uid: cookie_uid,
          advLayout: 1,
          hdggAdvInfoId: videoList.advInfoId,
          videoId: videoList.videoInfoList[0].videoId
        };
        $.ajax({
          type: "POST",
          url: baseUrl + 'bhideo/statistics/play',
          data: JSON.stringify(options3),
          headers: {'Content-Type': 'application/json'},
          success: function (res) {
            console.log('视频广告展示播放汇报', res)
          }
        });
      },
      onEnded: function () {
        console.log('JSMpeg already end');
        player2 = new JSMpeg.Player(videoList.videoInfoList[1].playURL, {
          disableGl: true,
          disableWebAssembly: true,
          loop: false,
          progressive: false,
          // chunkSize: 512 * 1024,
          poster: videoList.videoInfoList[1].firstFrame,
          canvas: document.querySelector('#canvas2'),
          onPlay: function () {
            $('#canvas2').show();
            player2.audioOut.unlock();
            player2.audioOut.volume = player.volume;
            voiceAlarm(player2)
            $('body').removeClass('videoBg2').css('background-image', 'url()');
          },
          onEnded: function () {
            console.log('JSMpeg already end');
            $('#openCloseMuted').hide();
            //完播汇报
            var options5 = {
              appkey: getUrlParam('appkey'),
              adSpaceKey: getUrlParam('adSpaceKey'),
              mobileSystem: 1,
              uid: cookie_uid,
              advLayout: 1,
              hdggAdvInfoId: videoList.advInfoId,
              videoId: ''
            }
            $.ajax({
              type: "POST",
              url: baseUrl + 'bhideo/statistics/endPlay',
              data: JSON.stringify(options5),
              headers: {'Content-Type': 'application/json;charset=utf8'},
              success: function (res) {
                console.log('完播汇报', res)
                shareUrl = window.location.href.replace('index', 'index2') + '&hdggAdvInfoId=' + videoList.advInfoId + '&advLayout=1'
                alertCommon();
                closeBtn();
                closeGo();
                share();
                endCardShow();
              }
            });
          }
        });
        player3 = new JSMpeg.Player(videoList.videoInfoList[2].playURL, {
          disableGl: true,
          disableWebAssembly: true,
          loop: false,
          progressive: false,
          poster: videoList.videoInfoList[2].firstFrame,
          // chunkSize: 512 * 1024,
          canvas: document.querySelector('#canvas3'),
          onPlay: function () {
            $('#canvas3').show();
            player3.audioOut.unlock();
            player3.audioOut.volume = player.volume;
            voiceAlarm(player3);
            $('body').removeClass('videoBg2').css('background-image', 'url()');

          },
          onEnded: function () {
            console.log('JSMpeg already end');
            $('#openCloseMuted').hide();
            //完播汇报
            var options5 = {
              appkey: getUrlParam('appkey'),
              adSpaceKey: getUrlParam('adSpaceKey'),
              mobileSystem: 1,
              uid: cookie_uid,
              advLayout: 1,
              hdggAdvInfoId: videoList.advInfoId,
              videoId: ''
            }
            $.ajax({
              type: "POST",
              url: baseUrl + 'bhideo/statistics/endPlay',
              data: JSON.stringify(options5),
              headers: {'Content-Type': 'application/json;charset=utf8'},
              success: function (res) {
                console.log('完播汇报', res)
                shareUrl = window.location.href.replace('index', 'index2') + '&hdggAdvInfoId=' + videoList.advInfoId + '&advLayout=1'
                alertCommon();
                closeBtn();
                closeGo();
                share();
                endCardShow();
              }
            });
          }
        });
        $('#choice').show();
        $('#openCloseMuted').hide();
        $('#question').text(videoList.videoInfoList[0].content)
        $('#choiceA').text(videoList.videoInfoList[1].content)
        $('#choiceB').text(videoList.videoInfoList[2].content)
        // console.log(videoList.videoInfoList.length)
        if (videoList.videoInfoList.length == 4) {
          $('#choiceC').show();
          player4 = new JSMpeg.Player(videoList.videoInfoList[3].playURL, {
            disableGl: true,
            disableWebAssembly: true,
            loop: false,
            progressive: false,
            poster: videoList.videoInfoList[3].firstFrame,
            // chunkSize: 512 * 1024,
            canvas: document.querySelector('#canvas4'),
            onPlay: function () {
              $('#canvas4').show();
              player4.audioOut.unlock();
              player4.audioOut.volume = player.volume;
              voiceAlarm(player4)
              $('body').removeClass('videoBg2').css('background-image', 'url()');
            },
            onEnded: function () {
              console.log('JSMpeg already end');
              $('#openCloseMuted').hide();
              //完播汇报
              var options5 = {
                appkey: getUrlParam('appkey'),
                adSpaceKey: getUrlParam('adSpaceKey'),
                mobileSystem: 1,
                uid: cookie_uid,
                advLayout: 1,
                hdggAdvInfoId: videoList.advInfoId,
                videoId: ''
              }
              $.ajax({
                type: "POST",
                url: baseUrl + 'bhideo/statistics/endPlay',
                data: JSON.stringify(options5),
                headers: {'Content-Type': 'application/json;charset=utf8'},
                success: function (res) {
                  console.log('完播汇报', res)
                  shareUrl = window.location.href.replace('index', 'index2') + '&hdggAdvInfoId=' + videoList.advInfoId + '&advLayout=1'
                  alertCommon();
                  closeBtn();
                  closeGo();
                  share();
                  endCardShow();
                }
              });
            }
          });
          $('#choiceC').text(videoList.videoInfoList[3].content)
        }
        // $('#question').text(videoList.videoInfoList[0].content);
        // var questionList = JSON.parse(JSON.stringify(videoList.videoInfoList));
        // $.each(questionList.splice(1), function (index, item) {
        //   $('#choice').append('<button class="choiceOne choice' + (index + 1) + '" style="margin-top: ' + (4 * index) + 'rem">' + item.content + '</button>')
        // })
      }
    });
    playing = player;
    player.audioOut.unlock();
    // console.log('ios音量', player.volume, player.audioOut.context.state)
    // console.log(player.audioOut.unlocked)
  }
}


function replay() {
  player.seek(0);
  player2.seek(0);
  player3.seek(0);
  if (videoList.videoInfoList.length == 4) {
    player4.seek(0);
  }
  playing = player;
  play();
}

function endCardShow() {
  // endcard广告展示汇报
  var options6 = {
    appkey: getUrlParam('appkey'),
    adSpaceKey: getUrlParam('adSpaceKey'),
    mobileSystem: 1,
    uid: cookie_uid,
    advLayout: 1,
    hdggAdvInfoId: videoList.advInfoId,
    videoId: ''
  }
  $.ajax({
    type: "POST",
    url: baseUrl + 'bhideo/statistics/endCardShow',
    data: JSON.stringify(options6),
    async: false,
    headers: {'Content-Type': 'application/json;charset=utf8'},
    success: function (res) {
      console.log('endcard广告展示汇报', res)
    }
  });
}

$('#redBag').click(function () {
  shareUrl = window.location.href.replace('index', 'index2') + '&hdggAdvInfoId=' + videoList.advInfoId + '&advLayout=1'
  alertCommon();
  closeBtn();
  closeGo();
  share();
});
//重新播放
$('#loop').click(function () {
  $('#redBag,#endChoice').hide();
  $('#canvas').show();
  $('#canvas2').hide();
  $('#canvas3').hide();
  $('#canvas4').hide();
  $('#openCloseMuted').show();
  replay()
})
//下一个
$('#next').click(function () {
  location.reload()
})

// 为统一用户交互即muted（静音）自动播放，Android系统下未使用chromium M71版本的webview仍不支持autoplay策略（浏览器市场占比较大）。

document.querySelector('#openCloseMuted').addEventListener('click', switch2, true)


$('#choiceA').click(function () {
  $('#choice').hide();
  $('#canvas').hide();
  $('#openCloseMuted').show();
  $('body').addClass('videoBg2').css('background-image', 'url(' + videoList.videoInfoList[1].firstFrame + ')');
  playing = player2;
  play();
  //点击互动按钮 汇报互动
  var options4 = {
    appkey: getUrlParam('appkey'),
    adSpaceKey: getUrlParam('adSpaceKey'),
    mobileSystem: 1,
    uid: cookie_uid,
    advLayout: 1,
    hdggAdvInfoId: videoList.advInfoId,
    videoId: videoList.videoInfoList[1].videoId
  }
  $.ajax({
    type: "POST",
    url: baseUrl + 'bhideo/statistics/interaction',
    data: JSON.stringify(options4),
    headers: {'Content-Type': 'application/json'},
    success: function (res) {
      console.log('汇报互动', res);
    }
  });
});

$('#choiceB').click(function () {
  $('#choice').hide();
  $('#canvas').hide();
  $('#openCloseMuted').show();
  $('body').addClass('videoBg2').css('background-image', 'url(' + videoList.videoInfoList[2].firstFrame + ')');
  playing = player3;
  play();
  //点击互动按钮 汇报互动
  var options4 = {
    appkey: getUrlParam('appkey'),
    adSpaceKey: getUrlParam('adSpaceKey'),
    mobileSystem: 1,
    uid: cookie_uid,
    advLayout: 1,
    hdggAdvInfoId: videoList.advInfoId,
    videoId: videoList.videoInfoList[2].videoId
  }
  $.ajax({
    type: "POST",
    url: baseUrl + 'bhideo/statistics/interaction',
    data: JSON.stringify(options4),
    headers: {'Content-Type': 'application/json'},
    success: function (res) {
      console.log('汇报互动', res);
    }
  })
});

$('#choiceC').click(function () {
  $('#choice').hide();
  $('#canvas').hide();
  $('#openCloseMuted').show();
  $('body').addClass('videoBg2').css('background-image', 'url(' + videoList.videoInfoList[3].firstFrame + ')');
  playing = player4;
  play();
  //点击互动按钮 汇报互动
  var options4 = {
    appkey: getUrlParam('appkey'),
    adSpaceKey: getUrlParam('adSpaceKey'),
    mobileSystem: 1,
    uid: cookie_uid,
    advLayout: 1,
    hdggAdvInfoId: videoList.advInfoId,
    videoId: videoList.videoInfoList[2].videoId
  }
  $.ajax({
    type: "POST",
    url: baseUrl + 'bhideo/statistics/interaction',
    data: JSON.stringify(options4),
    headers: {'Content-Type': 'application/json'},
    success: function (res) {
      console.log('汇报互动', res);
    }
  })
});
var haveShare = 1;

function share() {
  $('#hdgg_show-win-custom-pdd').on('click', '#shareBtn', function () {
    // //记录视频广告分享
    if (haveShare === 1) {
      var options8 = {
        appkey: getUrlParam('appkey'),
        adSpaceKey: getUrlParam('adSpaceKey'),
        mobileSystem: 1,
        uid: cookie_uid,
        advLayout: 1,
        hdggAdvInfoId: videoList.advInfoId,
      }
      $.ajax({
        type: "POST",
        url: baseUrl + 'bhideo/statistics/share',
        data: JSON.stringify(options8),
        headers: {'Content-Type': 'application/json;charset=utf8'},
        success: function (res) {
          console.log('用于记录分享', res)
        }
      });
    }
    if (!!androidSdk) {
      window.android.onShare(JSON.stringify({
        'shareUrl': shareUrl
      }));
    } else if (!!iosSdk) {
      setupWebViewJavascriptBridge(function (bridge) {
        bridge.registerHandler('onShareComplete', function (data, responseCallback) {
          console.log('oc分享后回传参数', data);
          // document.getElementById("textshow").innerHTML = (JSON.stringify(data));
          responseCallback('oc告诉我分享成功')
        });
        //分享时给ios传递分享链接
        bridge.callHandler('onShare', {
          'shareUrl': shareUrl
        }, function (response) {
          //分享成功后处理oc过来的回调
          console.log('收到oc过来分享:' + JSON.stringify(response))
        });
      });
    } else {
      var clipboard = new ClipboardJS('#shareBtn', {
        text: function () {
          return shareUrl;
        }
      });

      clipboard.on('success', function () {
        $('#hdgg_show-win-custom-pdd').append('<div id="shareSuccess">\n' +
            '  <span>复制成功</span>\n' +
            '</div>');
        setTimeout(function () {
          $('#shareSuccess').remove()
          clipboard.destroy()
        }, 1500)
      });

      clipboard.on('error', function (e) {
        alert('复制失败')
      });
    }
  })
}

function alertCommon() {
  var strs = '<div id="hdgg_show-win-custom-pdd">\n' +
      '        <img id="hdgg-image-custom-pdd" class="m-image" src="' + videoList.endCardUrl + '">\n' +
      '        <div class="card-sunshine"></div>\n' +
      '      <span class="close-btn closetc iconfont"></span></div>'
  $('body').append(strs);
  setTimeout(function () {
    $('#hdgg_show-win-custom-pdd').append('<button id="shareBtn">点击分享</button>');
  }, 1000)
}

function closeBtn() {
  $('#hdgg_show-win-custom-pdd').on('click', '.close-btn', function () {
    window.styleReset();
  })
}

function closeGo() {
  $('#hdgg_show-win-custom-pdd img').on('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    // endcard广告点击汇报
    var options7 = {
      appkey: getUrlParam('appkey'),
      adSpaceKey: getUrlParam('adSpaceKey'),
      mobileSystem: 1,
      uid: cookie_uid,
      advLayout: 1,
      hdggAdvInfoId: videoList.advInfoId,
      videoId: ''
    }
    $.ajax({
      type: "POST",
      url: baseUrl + 'bhideo/statistics/endCardClick',
      data: JSON.stringify(options7),
      async: false,
      headers: {'Content-Type': 'application/json;charset=utf8'},
      success: function (res) {
        console.log('endcard 点击做一个汇报', res)
        window.location.href = videoList.endUrl.indexOf('?') > -1 ?
            videoList.endUrl + '&' + location.search.split('?')[1].replace('LVJWKMDA', '') + '&hdggAdvInfoId=' +
            videoList.advInfoId + '&doumobkey=' + videoList.doumobkey + '&advMaterialId=' + videoList.advMaterialId :
            videoList.endUrl + '?' + location.search.split('?')[1].replace('LVJWKMDA', '') + '&hdggAdvInfoId=' +
            videoList.advInfoId + '&doumobkey=' + videoList.doumobkey + '&advMaterialId=' + videoList.advMaterialId;
      }
    });
  })
}


