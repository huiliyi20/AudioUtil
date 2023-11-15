# AudioUtil



- 作者：散人

- GitHub：[https://github.com/huiliyi20](https://github.com/huiliyi20)

- 版本：V2.0.1

- 文档更新日期：2023-11-15

- 说明：

  很多基于`JavaScript`的录音库，使用的浏览器API已经被废弃，在主流平台兼容性较差，且对音频数据的处理文档说明甚少，用起来不太方便。

  本依赖是基于当前主流API封装的`JavaScript`依赖库，可实现对音频的采集、源数据处理。

  使用方式非常简单！



## 标识说明

☀️：不可缺省

☕：建议缺省，默认获取类内部数据，不是自定义操作不要传

☘️：入参可缺省，默认从当前类录音数据获取

- 标识在**函数说明**上，函数所有参数都可缺省
- 标识在**单个参数**上：当前参数可缺省



## 创建示例

### 创建实例

```js
// 创建一个实例
let audioUtil = new AudioUtil();
```



### 获取录音权限

录音之前需要先获取录音权限，可通过以下两种方式获取。

1. 配置获取

   它会在实例创建时申请录音权限

   ```js
   new AudioUtil({
       authority: true,
       ...
   });
   ```

   

2. 执行函数获取

   此函数可更灵活地帮助你控制获取权限的时间，执行此函数以申请录音权限。

   ```js
   // 获取录音权限
   audioUtil.getAuthority();
   ```



### 使用示例

```js
let audioUtil = new AudioUtil({
    onstop: callback, // 停止录音回调
    authority: true, // 立即获取权限
    // keep: true, // 持续录音
});

// 开始录音按钮
document.getElementById('start-button').addEventListener('click', function () {
    audioUtil.start()
});

// 停止录音按钮
document.getElementById('stop-button').addEventListener('click', function () {
    audioUtil.stop()
});

// 播放录音按钮
document.getElementById('play-button').addEventListener('click', function () {
    audioUtil.play()
});
```



### 完整配置参数

请以如下格式实例化对象

```js
new AudioUtil({
	...
});
```

### 

以下是示例化类时，支持的配置的参数列表

- keep

  语音是否持续记录（下一次录音，会继续连接之前的录音）

  默认 `false`

- authority

  是否自动获取录音权限

  默认 `false`

- onstop

  每次录音结束回调

- ondataavailable

  录音过程时触发回调

- inputSampleRate

  输入采样率（默认48000）

- inputSampleBits

  输入采样数位 8, 16（默认16）

- outputSampleRate

  输出采样率（默认16000）

- outputSampleBits

  输出采样数位 8, 16（默认16）



## 常用API说明

### 录音控制

1. `start ()` 

   开始录音

2. `stop ()` 

   停止录音

3. `play ()` 

   播放录音



### 获取数据

1. `getBase64 (blob)`

   获取bae64数据 ☕

   **如果不需要自定义处理，请不要传参！**

   ```js
   /**
    * @param blobs Blob数组 
    * @return 返回Blob
    */
   ```

   

2. `getWavBlob (buffer)`

   获取wav格式blob ☕

   **如果不需要自定义处理，请不要传参！**

   ```js
   /**
    * @param blobs Blob数组 
    * @return 返回Blob
    */
   ```

   

3. `getBuffer (blob)`

   获取AudioBuffer格式数据 ☕

   **如果不需要自定义处理，请不要传参！**

   ```js
   /**
    * @param blobs Blob
    * @return 返回AudioBuffer
    */
   ```



### Ajax封装

`ajax (conf)` 

封装的异步函数，用法同 jQuery ☀️

```js
/**
 * 异步请求
 * @param conf
 *  headers: 头部信息
 *  data: 数据（字符串）
 *  success: 请求成功回调函数
 *  error: 请求异常回调函数
 */
```



## 源数据API说明

### 数据合并

1. `mergeBlobArray (blobArray)`

   将**Blob数组**合并为**单个Blob** ☕ ☘️

   ```js
   /**
    * @param blobs Blob数组 
    * @return 返回Blob
    */
   ```

   

2. `mergeBlobToBuffer (blob1, blob2)`

   合并**Blob**为**AudioBuffer** ☕ ☘️

   ```js
   /**
    * @param blob1
    * @param blob2
    * @return 返回AudioBuffer
    */
   ```

   

3. `mergeBuffer (buffer1, buffer2)`

   合并2个**AudioBuffer** ☕ ☘️

   ```js
   /**
    * @param buffer1
    * @param buffer2
    * @return 返回AudioBuffer
    */
   ```

   



### 音频压缩/转wav

压缩和转wav操作封装在 `audioHandle` 对象内，`audioHandle`对象节点如下：

- `compress (buffer)` ☕ ☘️

  压缩音频

  ```js
  /**
   * @param buffer buffer对象
   * @return 返回 Float32Array
   */
  ```

  

- `toWavBlob (bytes)` ☕ ☘️

  bytes转wav格式Blob

  ```js
  /**
   * @param bytes Float32Array格式数据
   * @return 返回WAV格式Blob
   */
  ```

  

### FileReader封装

1. `readerBuffer (blob)`

   **Blob** 转 **buffer** ☀️

   ```js
   /**
    * @param blob Blob对象
    * @return 返回ArrayBuffer
    */
   ```

   

2. `readerBase64 (blob)`

   **Blob**转 **base64** ☀️

   ```js
   /**
    * @param blob Blob对象
    * @return 返回base64字符串
    */
   ```

   

3. `readerBlob (blob)`

   读取**Blob**对象 ☀️

   ```js
   /**
    * @param blob Blob对象
    * @param type [buffer/base64]
    * @return 返回[ArrayBuffer/string]
    */
   ```

