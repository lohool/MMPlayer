    h5����ƵƬ������������
    
    Demo��
    <div  id="MMPLayer" style="width:800px;height:500px"></div>
     <script>
         $(function (){
             new MMPlayer({
                 video:[['http://localhost:9001/m/1.mp4',94], ['http://localhost:9001/m/2.mp4',62], ['http://localhost:9001/m/3.mp4',59]],
                 container:'MMPLayer'
             });
         })
     ��Ƶ�б�����Ƶ�����һ����������Ƶ���ŵ�ַ���ڶ�����������ƵƬ�ε�ʱ��������
     ��Ƶ�б�����֧�����·�ʽ����ָ��ʱ��ʱ���������Զ����㣨Ƭ��������ʱ���Ƽ�����
     1. video:['http://localhost:9001/m/1.mp4', 'http://localhost:9001/m/2.mp4', 'http://localhost:9001/m/3.mp4'],
     2. video:['http://localhost:9001/m/1.mp4'],
     3. video:'http://localhost:9001/m/1.mp4',