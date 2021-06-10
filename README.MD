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