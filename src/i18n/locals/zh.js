export default {
  translation: {
    title: "NeuroVirtual",
    subtitle: "神经学研究记录系统",
    patientData: "患者数据",
    name: "名字",
    lastName: "姓氏",
    identification: "身份证号",
    age: "年龄",
    studyType: "研究类型",
    availableCameras: "可用摄像头",
    addCamera: "添加IP/RTSP摄像头",
    add: "添加",
    remove: "删除",
    supportedFormats: "支持的格式：RTSP、HLS (.m3u8)、HTTP/HTTPS (MJPEG, MP4)",
    startRecording: "开始录制",
    stopRecording: "停止录制",
    recordingInProgress: "正在录制",
    recordingSaved: "录制已保存！",
    recordingsSaved: "录制已保存！",
    newRecording: "新录制",
    patientInfo: "患者信息：",
    recordingDetails: "录制详情：",
    folder: "文件夹：",
    duration: "时长：",
    date: "日期：",
    years: "岁",
    cameras: "个摄像头",
    camera: "摄像头",
    willRecord: "将录制",
    simultaneously: "同时",
    videoSaved: "视频已成功保存到患者文件夹",
    videosSaved: "${count}个视频已成功保存到患者文件夹",
    removeIpCamera: "删除IP摄像头",
    placeholders: {
      patientName: "患者姓名",
      patientLastName: "患者姓氏",
      documentNumber: "证件号码",
      ageYears: "年龄",
      rtspUrl: "rtsp://localhost:8554/live"
    },
    studyTypes: {
      eeg: "脑电图 (EEG)",
      emg: "肌电图 (EMG)",
      sleep: "睡眠研究（多导睡眠图）",
      evoked: "诱发电位",
      mapping: "脑图谱"
    },
    alerts: {
      enterValidUrl: "请输入有效的URL",
      rtspWarning: "⚠️ RTSP URL需要转换为HLS。\n\n1. 启动后端服务器：\n   cd server\n   npm start\n\n2. 然后RTSP摄像头将自动转换。\n\n按确定继续。"
    }
  }
};
