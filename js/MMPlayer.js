/*
    h5多视频片段连播播放器
    
    Demo：
    <div  id="MMPLayer" style="width:800px;height:500px"></div>
     <script>
         $(function (){
             new MMPlayer({
                 video:[['http://localhost:9001/m/1.mp4',94], ['http://localhost:9001/m/2.mp4',62], ['http://localhost:9001/m/3.mp4',59]],
                 container:'MMPLayer'
             });
         })
     视频列表中视频数组第一个参数是视频播放地址，第二个参数是视频片段的时长秒数。
     视频列表另外支持以下方式，不指定时长时播放器将自动计算（片段数量多时不推荐）：
     1. video:['http://localhost:9001/m/1.mp4', 'http://localhost:9001/m/2.mp4', 'http://localhost:9001/m/3.mp4'],
     2. video:['http://localhost:9001/m/1.mp4'],
     3. video:'http://localhost:9001/m/1.mp4',
*/
function MMPlayer(ops){
   let defaultOps = {
        //格式为 [['xxx.mp4',18],...]
        container:"MMPlayer",
        video:[],
        autoPlay:false
    }
    //复制参数
    ops = $.extend(true,defaultOps,ops);
    this.init(ops);
}

MMPlayer.prototype.init = function (ops){
    console.debug('初始化赋值开始。')
     //总时间
    this.totalTime = 0;
    this.timeLine = [];
    let errMsg = "初始化失败,video标签格式不正确."
    //当前播放的视频段index
    this.currentIndex = 0;
    //记录下一段缓存的index
    this.preloadIndex = 1;
    //当前的播放时间
    this.currentTime = 0;
    this.nextIndex = 0;
    //当前正在缓冲的视频序号
    this.currentPreloadIndex = 0;
    this.videoContainer;
    this.video = ops.video;
    this.container = ops.container ;
    this.autoPlay=ops.autoPlay;
    //this.hls=false;
    this.hlsPlayer=null;
    if(typeof(ops.video)=="string")this.video = [ops.video];
    //校验video格式
    let video = this.video;
    if(video.length == 0){
        console.error('video视频至少大于1');
        return;
    }
    //if(this.hls)this.hlsPlayer = new Hls();
    this.initVideoPlayer();

    if(typeof(video[0])=="string")
    {
        this.autoGetTotalTime();
    }
    else
    {
        this.getTotalTime();
        this.startPlay();
    }
    console.debug("初始化赋值结束。");

}

/**
按指定的片段时长计算总时长
*/
MMPlayer.prototype. getTotalTime=function() { 
    for (let i in this.video){
        let v = this.video[i];
        let suffix = v[0].substr(v[0].lastIndexOf(".")+1);
        //if(["mp4"].indexOf(suffix) == -1){
        //    console.error(suffix,"格式不正确");
        //    return;
        //}
        if(!v[1] || isNaN(parseInt(v[1])) ){
            console.error("video时长不正确");
            return;
        }
        this.timeLine[i] = parseInt(v[1]);
        this.totalTime += parseInt(v[1]);
    }

}

/**
 没有设置片段时长数值时，自动读取视频元数据进行时长计算
*/
MMPlayer.prototype.autoGetTotalTime=function() { 
    var _timeLine=this.timeLine;
    var currentPreloadIndex=0;
    var _totalTime=this.totalTime;
    var _video=this.video;
    var _this=this;
    var videoPlayer=$('.MMPlayer video')[1];
    var autoGet=function ()
    {
        _timeLine[currentPreloadIndex] = $('.MMPlayer video') [1].duration; 
        _totalTime += _timeLine[currentPreloadIndex]; 
        _this.totalTime=_totalTime;
        _this.timeLine=_timeLine;
        console.log("totalTime="+_this.totalTime);
        if (currentPreloadIndex < _video.length - 1) { 
           this._play(videoPlayer, _video[++currentPreloadIndex]);
        } else { 
            //videoPlayer.src = ''; 
            this._play(videoPlayer,"");
            videoPlayer.removeEventListener('loadedmetadata', autoGet, true); 
            console.log("inited.");
            currentPreloadIndex=0;
            _this.startPlay();
        } 
    };
       videoPlayer.preload = 'auto'; 
       this._play(videoPlayer,_video[0]);
       videoPlayer.addEventListener('loadedmetadata', autoGet, true); 

} 
MMPlayer.prototype.getVideoSrc = function (video){
    if(typeof(video)=="string")return video;
    else return video[0];
}

/**
 * 初始化video构造器
 */
MMPlayer.prototype.initVideoPlayer = function (){
    console.debug("初始化video组件。",this.container);
    let _v = $('#'+this.container);
    this.container = _v;
    if(!_v[0]){
        console.error("没有找到id",this.container,"的容器。");
        return;
    }
    _v.addClass("MMPlayer");
    //1.添加用于播放和用于缓存的video标签
    this.videoContainer =  $('<div class="MMPlayer_c0" style="width: 100%;height: 100%"></div>');
    //let playingVideo = $('<video class=" MMPlayer_playing" preload="auto" src="'+this.video[0][0]+'"></video>');
    //let playingVideo = $('<video class=" MMPlayer_playing" preload="auto" src="'+this.getVideoSrc(this.video[0])+'"></video>');
    let playingVideo = $('<video class=" MMPlayer_playing" preload="auto"></video>');
    this._play(playingVideo[0],this.getVideoSrc(this.video[0]));
    let preloadVideo = $('<video class=" MMPlayer_preload" preload="auto"></video>');
    this.videoContainer.append(playingVideo);
    this.videoContainer.append(preloadVideo);

    //2.添加控制器,初始化页面html
    this.videoControls = $('<div class="MMPlayer_controls"></div>');
    this.control = $('<div class="videoControl"></div>');
    this.showProgress = $('<span class="showProgress"></span>');
    this.videoButtons = $('<div class="videoButton"></div>')
    this.playBtn = $('<div class="playBtn"></div>');
    this.fullScreenBtn = $('<div class="fullScreenBtn" title="全屏"></div>');
    this.progressWrap = $('<div class="progressWrap" ></div>');
    this.playProgress = $('<div class="playProgress" ></div>');

    //进度条定时器变量
    this.progressFlag = '';
    //当前是否全屏
    this.isFullScreen ='';
    this.videoControls.append(this.progressWrap);
    this.videoControls.append(this.control);
    //进度条
    this.progressWrap.append(this.playProgress);
    //时间显示和按钮添加
    this.control.append(this.showProgress);
    this.control.append(this.videoButtons);

    this.videoButtons.append(this.playBtn);
    this.videoButtons.append(this.fullScreenBtn);

    this.videoControls.append(this.videoControls);

    this.videoContainer.append('<div class="video_play" ></div>');
    this.videoContainer.append('<div class="video_pause" style="display: none"></div>');
    _v.append(this.videoContainer);
    _v.append(this.videoControls);
}

MMPlayer.prototype.startPlay = function (){

    let _this =this;
    //设置进度条时间
    //$('.showProgress').html(0+'/'+formatSeconds(this.totalTime));
    setInterval(function (){
        _this.setProgress();
    },500);
    this.initControl();
    //绑定缓冲事件

    if(this.video.length > 1){
        this.getVideo(1).one('canplaythrough',function (){
            _this.canPlayComplete();
        })
    }
        if(this.autoPlay)this.play();
}

/**
 * 当视频加载完的时候
 */
MMPlayer.prototype.canPlayComplete = function (){
    console.debug('当前视频缓冲完毕:currentIndex:',this.currentIndex,'预备缓冲下一段视频:nextIndex:',this.preloadIndex);
    let nextLocationIndex = this.currentIndex+1;
    if(nextLocationIndex >= this.video.length){
        console.debug('已经加载到最后一段视频。')
        return;
    }
    //this.preloadIndex = nextLocationIndex;
   // this.getVideo(2)[0].src = this.getVideoSrc(this.video[nextLocationIndex]);
     this._play(this.getVideo(2)[0],this.getVideoSrc(this.video[nextLocationIndex]));
    console.debug('正在缓冲下一段视频:',this.getVideoSrc(this.video[nextLocationIndex]));

}

/**
 * 切换下一段视频
 */
MMPlayer.prototype.switchNextVideo = function (toTime){
    let _this = this;
    let totime = toTime || 0;
    let oldVideo = this.getVideo(1);
    let nextPlayer = _this.currentIndex +1;
    let newVideo = this.getVideo(2);
    //console.debug(newVideo[0],oldVideo[0]);
    if (nextPlayer < _this.video.length ) {
        console.debug('切换视频nextIndex',nextPlayer);
        oldVideo.removeClass('MMPlayer_playing');
        oldVideo.addClass('MMPlayer_preload');
        newVideo.addClass('MMPlayer_playing');
        newVideo.removeClass('MMPlayer_preload');
        //强制隐藏中间按钮
        $('.video_play').hide();
        _this.currentIndex = nextPlayer;
        newVideo[0].currentTime = totime;
        newVideo[0].play();
        newVideo.one('canplaythrough',function (){
            _this.canPlayComplete();
        })
        //_this.nextIndex = nextPlayer+1;

    } else {
        //$('.video')[playerNum].removeEventListener('ended', switchNextVideo, true);
    }

}

/**
 * 播放和暂停事件
 */
MMPlayer.prototype.play = function (){
    //获取当前的视频
    let _this = this;
    let video =_this.getVideo(1)[0];
    console.log(_this.getVideo(1)[0])
    if(video.paused || video.ended){
        if(video.ended){
            video.currentTime = 0;
        }
        video.play();
    }
    else{
        video.pause();
    }
}

MMPlayer.prototype.setProgress = function (){
    let video = this.getVideo(1)[0];
    //截至到当前片段之前已播放的所有片段的总时长
    let totalTime = 0;    
    for (let i = 0; i < this.currentIndex; i++) {
        totalTime+= this.timeLine[i];
    }    
    //console.log('currentIndex:',this.currentIndex,',totalTime:',totalTime);
    let realTime = totalTime+video.currentTime;
    let percent = realTime /this.totalTime;
    this.playProgress.css('width',percent * this.progressWrap[0].offsetWidth+'px');
    this.currentTime = realTime;
    this.showProgress.html(formatSeconds(realTime)+'/'+formatSeconds(this.totalTime));

}

MMPlayer.prototype.initControl = function (){
    //给控制器绑定事件
    let _this = this;

    //遮罩层按钮事件
    this.videoContainer.on('click','.video_play',function (){
        _this.play();
    });

    //点击视频事件
    this.videoContainer.on('click','video',function (){
        _this.play();
    });

    //鼠标进入视频事件
    this.container.on('mouseover','video',function (){
        _this.videoControls.css('display','inline');
    })

    //鼠标进入控制器事件
    _this.videoControls.on('mouseover',function (){
        _this.videoControls.css('display','inline');
    })

    //鼠标离开视频事件
    this.container.on('mouseout','video',function (){
        _this.videoControls.css('display','none');
    })
    //鼠标离开控制器事件
    _this.videoControls.on('mouseout',function (){
        _this.videoControls.css('display','none');
    })

    //播放按钮事件
    _this.playBtn.on('click',function (){
        _this.play();
    })

    //监听播放器的播放状态随时改变图标
    _this.addVideoListener('play',function(){
        $('.video_play').hide();
        //_this.playBtn.css("background",'url("../pause.svg")');
        //console.debug(_this.playBtn.css("background"),'-------------------------');
        //_this.playBtn.css("background-size",'100% 100%');
        _this.playBtn.removeClass('playBtn');
        _this.playBtn.addClass('pauseBtn');
    });

    _this.addVideoListener('pause',function (){
        //中间显示图标
        $('.video_pause').hide();
        $('.video_play').show();
        _this.playBtn.removeClass('pauseBtn');
        _this.playBtn.addClass('playBtn');
        //_this.playBtn.css("background",'url("'+ctx+'/static/vms/h5Video/play.svg")');
        //_this.playBtn.css("background-size",'100% 100%');
    })

    //鼠标点击进度条
    _this.progressWrap.on('mousedown',function (e){
        let t = _this.progressWrapClick(e);
        _this.videoSeek(t);
    })

    //点击全屏事件
    _this.fullScreenBtn.on('click',function (){
        _this.fullScreen(_this);
    });

    //switchNextVideo
    _this.getVideo(1).on('ended',function (){
        _this.switchNextVideo();
    })
    _this.getVideo(2).on('ended',function (){
        _this.switchNextVideo();
    })

}

/**
 * 全屏 
 * @param _this
 */
MMPlayer.prototype.fullScreen = function (_this){
    if(_this.isFullScreen){
        _this.videoContainer[0].webkitCancelFullScreen();
    }
    else{
        _this.videoContainer[0].webkitRequestFullscreen();
    }
}

/**
 * 点击进度条
 * @param e
 * @returns {number}
 */
MMPlayer.prototype.progressWrapClick = function (e){
    let _this = this;
    console.debug('视频跳转逻辑开始----');
    //计算百分比
    let offLeft = _this.progressWrap[0].offsetLeft;
    let offParent = _this.progressWrap[0].offsetParent;
    while(offParent){
        offLeft += offParent.offsetLeft;
        offParent = offParent.offsetParent;
    }
    //console.debug('pageX:',e.pageX,'progressLeft',offLeft,'width:',_this.progressWrap[0].offsetWidth);
    let percent = (e.pageX-offLeft) / _this.progressWrap[0].offsetWidth;
    console.debug('percent:',percent);
    _this.playProgress.css('width',percent * (_this.progressWrap[0].offsetWidth) - 2 + "px") ;
    return percent * _this.totalTime;
}

MMPlayer.prototype.videoSeek = function (time){
    let _this = this;
    console.debug('videoSeek,time:',time);
    //获取跳转前的视频
    let playVideo=this.getVideo(1);
    if(playVideo.paused || playVideo.ended){
        _this.play();
    }
    let preloadVideo = this.getVideo(2);
    let videoChapter;
    if (time >= this.totalTime) {
        videoChapter = this.video.length - 1;
        time = this.totalTime;
    } else {
        for (videoChapter = 0; videoChapter < this.video.length - 1; videoChapter++) {
            if (time - this.timeLine[videoChapter] < 0) {
                break;
            } else {
                time -= this.timeLine[videoChapter];
            }
        }
    }
    console.debug('跳转后计算的时间点:',time,'跳转前视频index:',this.currentIndex,',跳转后视频index：',videoChapter);
    //判断视频跳转的是不是位于同一个视频段内
    if (videoChapter == this.currentIndex) {
        playVideo[0].currentTime = time;
    } else if(videoChapter == this.currentIndex+1){
        _this.switchNextVideo(time);
        // this.currentIndex = videoChapter;
        // playVideo[0].pause();
        // playVideo.removeClass('MMPlayer_playing');
        // playVideo.addClass('MMPlayer_preload');
        // preloadVideo.removeClass('MMPlayer_preload');
        // preloadVideo.addClass('MMPlayer_playing');
        // //注意此时其实是给正在播放的video添加该事件
        // preloadVideo[0].currentTime = time;
        // preloadVideo[0].play();
        // preloadVideo.one('canplaythrough',function (){
        //     _this.canPlayComplete();
        // })
    }
    else {
        //preloadVideo[0].src = this.getVideoSrc(this.video[videoChapter]);
        this._play(preloadVideo[0],this.getVideoSrc(this.video[videoChapter]));
        _this.currentIndex = videoChapter;
        preloadVideo.one('loadeddata',function (){
            preloadVideo[0].currentTime = time;
            preloadVideo[0].play();
            playVideo.removeClass('MMPlayer_playing');
            playVideo.addClass('MMPlayer_preload');
            preloadVideo.removeClass('MMPlayer_preload');
            preloadVideo.addClass('MMPlayer_playing');
            //playVideo[0].play();
        });
        preloadVideo.one('canplaythrough',function (){
            _this.canPlayComplete();
        })
    }
}
String.prototype.endWith = function (endStr) {
    var d = this.length - endStr.length;
    return (d >= 0 && this.lastIndexOf(endStr) == d);
}
MMPlayer.prototype._play = function (video,src)
{
    var uSrc=src.toUpperCase();
    if(uSrc.endWith(".TS") || uSrc.endWith(".M3U8"))
    {
        if(this.hlsPlayer==null)this.hlsPlayer=new Hls();
        this.hlsPlayer.loadSource(src);
        this.hlsPlayer.attachMedia(video);
    }
    else
    {
        video.src=src;
    }
}

/**
 * 将秒数换成时分秒格式
 */

function formatSeconds(t) {
    t = parseInt(t);
    if (t < 60) return "00:" + ((i = t) < 10 ? "0" + i : i);
    if (t < 3600) return "" + ((a = parseInt(t / 60)) < 10 ? "0" + a : a) + ":" + ((i = t % 60) < 10 ? "0" + i : i);
    if (3600 <= t) {
        var a, i, e = parseInt(t / 3600);
        return (e < 10 ? "0" + e : e) + ":" + ((a = parseInt(t % 3600 / 60)) < 10 ? "0" + a : a) + ":" + ((i = t % 60) < 10 ? "0" + i : i);
    }
}

/**
 * 返回当前正在播放的video的jquery对象
 * @param val  1.playing  2.preload
 * @returns {*|Array|*[]|Window.jQuery|HTMLElement}
 */
MMPlayer.prototype.getVideo = function (val){

    return val == 1?$('.MMPlayer .MMPlayer_playing'):$('.MMPlayer .MMPlayer_preload');
}

MMPlayer.prototype.addVideoListener = function (event,func){
    //添加监听事件
    this.videoContainer.children('video').each(function (){
        $(this).on(event,function (){
            if($(this).hasClass('MMPlayer_playing')){
                func();
            }
        });
    });
}