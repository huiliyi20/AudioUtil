/**
 * @Author: 散人
 * @Version: 2.0.1
 * @Date: 2023-11-15
 * @description: 这是一个音频处理封装类，集录制、处理为一体，功能强大
 */
var AudioUtil = (function () {
    function _AudioUtil(option) {
        if (!(this instanceof _AudioUtil)) {
            throw '必须通过new关键字实例化对象！';
        }
        option = option || {};

        let config = {
            keep: option.keep || false, // 是否持续记录
            authority: option.authority || false, // 是否自动获取权限
            inputSampleRate: option.inputSampleRate || 48000, // 输入采样率
            inputSampleBits: option.inputSampleBits || 16, // 输入采样数位 8, 16
            outputSampleRate: option.outputSampleRate || 16000, // 输出采样率
            outputSampleBits: option.outputSampleBits || 16, // 输出采样数位 8, 16
        };
        // 媒体记录器
        let mediaRecorder;
        // 音频数据
        const audioData = {
            blobs: [], // 录音缓存-blob
            buffer: [], // 录音缓存-buffer
            size: 0, // 录音文件长度
            clear() { // 清空
                this.blobs = [];
                this.buffer = [];
                this.size = 0;
            }
        };

        this.version = '2.0.1';
        // 录音过程
        this.ondataavailable = option.ondataavailable || function(){};
        // 录音结束时
        this.onstop = option.onstop || function(){};

        // 初始化（获取权限）
        this.getAuthority = function () {
            // 获取录音权限
            navigator.mediaDevices.getUserMedia({
                audio: true
            }).then(stream => {
                mediaRecorder = new MediaRecorder(stream);

                // 录音过程
                mediaRecorder.ondataavailable = event => {
                    if (event.data.size > 0) {
                        audioData.blobs.push(event.data);
                    }
                    this.ondataavailable(event);
                };

                // 录音结束时
                mediaRecorder.onstop = async () => {
                    this.onstop(await this.getBase64());
                };
            }).catch(e => {
                console.error('获取权限失败');
            });
        };

        if (config.authority) {
            this.getAuthority();
        }

        // 合并AudioBuffer
        this.mergeBuffer = async function (buffer1, buffer2) {
            // 创建一个新的 AudioContext
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            // 计算新的 AudioBuffer 的长度
            const length = buffer1.length + buffer2.length;
            // 创建一个新的 AudioBuffer
            const mergedBuffer = audioContext.createBuffer(1, length, buffer1.sampleRate);
            // 获取左声道数据
            const channelData = mergedBuffer.getChannelData(0);
            // 将第一个 buffer 的数据复制到新的 buffer
            channelData.set(buffer1.getChannelData(0), 0);
            // 将第二个 buffer 的数据复制到新的 buffer
            channelData.set(buffer2.getChannelData(0), buffer1.length);
            return mergedBuffer;
        };

        // 合并blob为AudioBuffer
        this.mergeBlobToBuffer = async function (blob1, blob2) {
            let buffer1 = await this.getBuffer(blob1);
            let buffer2 = await this.getBuffer(blob2);
            return await this.mergeBuffer(buffer1, buffer2);
        };

        // 合并blob数组
        this.mergeBlobArray = async function (array) {
            array = array || audioData.blobs;
            if (array.length == 1) return array[0];
            let buffer = await this.getBuffer(array[0]);
            for (let i = 1; i < array.length; i++) {
                let bufferTp = await this.getBuffer(array[i]);
                buffer = await this.mergeBuffer(buffer, bufferTp);
            }
            return await this.getWavBlob(buffer);
        };

        // 获取AudioBuffer
        this.getBuffer = async function (blob) {
            const audioContext = new AudioContext();
            // 合并blob
            let mergeBlob = blob || await this.mergeBlobArray();
            // 读取blob为buffer对象
            let readerBuffer = await this.readerBuffer(mergeBlob);
            // 音频解码
            let audioBuffer = await audioContext.decodeAudioData(readerBuffer);
            return audioBuffer;
        };

        // 获取wav格式blob
        this.getWavBlob = async function (bf) {
            let buffer = bf || await this.getBuffer();
            // 读取源数据
            audioData.buffer = buffer.getChannelData(0);
            // 转wav格式blob
            let wavBlob = this.audioHandle.toWavBlob();
            return wavBlob;
        };

        // 获取wav格式blob
        this.getBase64 = async function (blob) {
            let wavBlob = blob || await this.getWavBlob();
            // 转base64上传
            let base64 = await this.readerBase64(wavBlob);
            return {
                base64: base64,
                length: wavBlob.size
            };
        };

        // 启动录音
        this.start = function () {
            if (!config.keep) {
                audioData.clear();
            }
            mediaRecorder.start();
        };

        // 停止录音
        this.stop = function () {
            mediaRecorder.stop();
        };

        // 播放录音
        let playOldTime = 0;
        this.play = function () {
            if (new Date().getTime() <= playOldTime || audioData.blobs.length < 1) return;
            let audioContext = new AudioContext();
            this.getBuffer().then(buffer => {
                playOldTime = new Date().getTime() + (buffer.duration * 1000); // 时长
                let source = audioContext.createBufferSource();
                source.buffer = buffer;
                source.connect(audioContext.destination);
                source.start();
            });
        };

        /**
         * 异步请求
         * @param conf
         *  headers: 头部信息
         *  data: 数据（字符串）
         *  success: 回调函数
         *  error: 回调函数
         */
        this.ajax = function (conf) {
            let xhr = new XMLHttpRequest();
            xhr.onloadend = function () {
                if (!conf.success) return;
                conf.success(xhr.responseText, xhr);
            };
            xhr.onerror = function () {
                if (!conf.error) return;
                conf.error(xhr);
            };
            xhr.open(conf.type ? conf.type : 'GET', conf.url);
            for (let key in conf.headers) {
                xhr.setRequestHeader(key, conf.headers[key]);
            }
            xhr.send(conf.data);
        };

        // blob转buffer
        this.readerBuffer = async function (blob) {
            return this.readerBlob(blob, 'buffer');
        };

        // blob转base64
        this.readerBase64 = async function (blob) {
            return this.readerBlob(blob, 'base64');
        };

        // 读取blob对象
        this.readerBlob = async function (blob, type) {
            return new Promise((resolve, reject) => {
                let reader = new FileReader();
                reader.onloadend = () => {
                    resolve(reader.result);
                };
                if (type == 'buffer') {
                    reader.readAsArrayBuffer(blob);
                } else if (type == 'base64') {
                    reader.readAsDataURL(blob);
                }
            });
        };

        // 音频处理对象
        this.audioHandle = {
            // 压缩
            compress(buffer) {
                buffer = buffer || audioData.buffer;
                let compression = parseInt(config.inputSampleRate / config.outputSampleRate);
                let length = buffer.length / compression;
                let result = new Float32Array(length);
                let index = 0, j = 0;
                while (index < length) {
                    result[index] = buffer[j];
                    j += compression;
                    index++;
                }
                return result;
            },
            // wav编码
            toWavBlob(bytes) {
                let sampleRate = Math.min(config.inputSampleRate, config.outputSampleRate);
                let sampleBits = Math.min(config.inputSampleBits, config.outputSampleBits);
                bytes = bytes || this.compress();
                let dataLength = bytes.length * (sampleBits / 8);
                let buffer = new ArrayBuffer(44 + dataLength);
                let data = new DataView(buffer);

                let channelCount = 1; // 单声道
                let offset = 0;

                let writeString = function (str) {
                    for (let i = 0; i < str.length; i++) {
                        data.setUint8(offset + i, str.charCodeAt(i));
                    }
                };

                // 资源交换文件标识符
                writeString('RIFF');
                offset += 4;
                // 下个地址开始到文件尾总字节数,即文件大小-8
                data.setUint32(offset, 36 + dataLength, true);
                offset += 4;
                // WAV文件标志
                writeString('WAVE');
                offset += 4;
                // 波形格式标志
                writeString('fmt ');
                offset += 4;
                // 过滤字节,一般为 0x10 = 16
                data.setUint32(offset, 16, true);
                offset += 4;
                // 格式类别 (PCM形式采样数据)
                data.setUint16(offset, 1, true);
                offset += 2;
                // 通道数
                data.setUint16(offset, channelCount, true);
                offset += 2;
                // 采样率,每秒样本数,表示每个通道的播放速度
                data.setUint32(offset, sampleRate, true);
                offset += 4;
                // 波形数据传输率 (每秒平均字节数) 单声道×每秒数据位数×每样本数据位/8
                data.setUint32(offset, channelCount * sampleRate * (sampleBits / 8), true);
                offset += 4;
                // 快数据调整数 采样一次占用字节数 单声道×每样本的数据位数/8
                data.setUint16(offset, channelCount * (sampleBits / 8), true);
                offset += 2;
                // 每样本数据位数
                data.setUint16(offset, sampleBits, true);
                offset += 2;
                // 数据标识符
                writeString('data');
                offset += 4;
                // 采样数据总数,即数据总大小-44
                data.setUint32(offset, dataLength, true);
                offset += 4;
                // 写入采样数据
                if (sampleBits === 8) {
                    for (let i = 0; i < bytes.length; i++, offset++) {
                        let s = Math.max(-1, Math.min(1, bytes[i]));
                        let val = s < 0 ? s * 0x8000 : s * 0x7FFF;
                        val = parseInt(255 / (65535 / (val + 32768)));
                        data.setInt8(offset, val, true);
                    }
                } else {
                    for (let i = 0; i < bytes.length; i++, offset += 2) {
                        let s = Math.max(-1, Math.min(1, bytes[i]));
                        data.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
                    }
                }

                return new Blob([data], {type: 'audio/wav'});
            }
        };
    }

    return _AudioUtil;
})();
