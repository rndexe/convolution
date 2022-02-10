class AudioConvolver {
  static get IMPULSE_URLS() {
    return [
      "arvalam_caves.m4a",
      "aguada_tank.m4a",
      "cabo_de_rama.m4a",
      "bom_jesu.m4a",
      "rivona_caves_1.m4a",
      "rivona_caves_2.m4a",
      "tambdi_surla.m4a",
      "se.m4a",
      "shantadurga.m4a",
      "sao_jacinto_church.m4a",
      "sao_jacinto_abandoned_light_house.m4a",
      "safa_mazjid.m4a",
      "prenha_da_franca.m4a",
      "namazgah.m4a",
      "margaon.m4a",
      "lamgaon.m4a",
      "kurdi.m4a",
      "corjuem.m4a",
      "st_catherine.m4a",
      "st_cajetan.m4a",
    ];
  }
  static get LIVESTREAM_PATH() {
    return 'https://cast.sound.codes/radio/8000/radio.mp3';
  }
  static get IS_SAFARI() {
    return (navigator.vendor && navigator.vendor.indexOf('Apple') > -1 &&
    navigator.userAgent &&
    navigator.userAgent.indexOf('CriOS') == -1 &&
    navigator.userAgent.indexOf('FxiOS') == -1) || 
    (/iPad|iPhone|iPod/.test(navigator.platform)) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }
  static get BUFFER_LENGTH() {
    return 1000 * 60;
  }
  get _bufferPath() {
    // return './assets/2020-07-09_04-39.mp3';
    // return './assets/15sec.wav';
    return `https://radio.sound.codes/buffer/${formatDate(new Date(this._rounded - (AudioConvolver.BUFFER_LENGTH * this._count--)), 'YYYY-MM-DD_HH-mm')}.mp3`
  }
  _decodeAudioData(arrayBuffer) {
    return new Promise(res => {
      this._context.decodeAudioData(
        arrayBuffer, 
        function(audioBuffer) {
          if (!audioBuffer) {
            throw('error decoding file data: ' + url);
          }
          res(audioBuffer);
        },
        function(error) {
          throw('decodeAudioData error', error);
        }
      )
    })
    .catch(alert)
  }
  _decodeBuffersArray(buffers) {
    return Promise.all(
      buffers.map(
        arrayBuffer => this._decodeAudioData(arrayBuffer)
      )
    )
  }
  _loadArrayBuffer(url) {
    return fetch(url)
    .then(response => response.arrayBuffer())
    .catch(alert)
  }
  _loadImpulses() {
    const PATH_TO_IMPULSE = './assets/';
    //const PATH_TO_IMPULSE = 'https://radio.sound.codes/signatures/';
    return Promise.all(
      AudioConvolver.IMPULSE_URLS.map(url => 
        this._loadArrayBuffer(PATH_TO_IMPULSE + url)
      )
    )
  }

  removeImpulse() {
    this.impulseIdx = -1;
    const source = this._source[this._currIdx];
    this._convolver.disconnect();
    source.disconnect();
    source.connect(this._spectrogram.analyser);
    this._convolverConnected = false;
  }
  updateImpulse(idx) {
    this.impulseIdx = idx;
    const source = this._source[this._currIdx];
    if(!this._convolverConnected) {
      source.disconnect();
      this._convolverConnected = true;
    } else {
      this._convolver.disconnect();
      source.disconnect();
    }
    this._convolver.buffer = this._buffers[idx];
    source.connect(this._convolver);
    this._convolver.connect(this._spectrogram.analyser);
  }
  _switchSource(idx) {
    const other = (idx + 1) % 2;
    this._currIdx = other;
    this._source[idx].disconnect();
    if(this._convolverConnected) {
      this._source[other].connect(this._convolver);
    } else {
      this._source[other].connect(this._spectrogram.analyser);
    }
    this._source[other].start();
    this._source[idx] = this._getBufferSource(idx);
  }
  _getBufferSource(idx, playOnLoad) {
    const source = this._context.createBufferSource();
    source.addEventListener('ended', _ => this._switchSource(idx));
    this._loadArrayBuffer(this._bufferPath)
    .then(arrayBuffer => this._decodeAudioData(arrayBuffer))
    .then(audioBuffer => {
      source.buffer = audioBuffer;
      if(playOnLoad) source.start();
    });
    return source;
  }
  _createSpectrogram(spectrogramContainer) {
    this._spectrogram = new Spectrogram(this._context, spectrogramContainer);
    this._spectrogram.analyser.connect(this._context.destination);
  }
  _createConvolver() {
    this._convolver = this._context.createConvolver();
    this._convolver.buffer = this._buffers[0];
  }
  _createContext() {
    this._context = new (window.AudioContext || window.webkitAudioContext)();
    this._context.createGain = this._context.createGainNode;
    this._context.createDelay = this._context.createDelayNode;
    this._context.createScriptProcessor = this._context.createJavaScriptNode;
    if (this._context.state === 'suspended') {
      this._context.resume();
    }
  }
  _createSource(source) {
    this._currIdx = 0;
    this._source = [];
    if(AudioConvolver.IS_SAFARI) {
      this._setupBufferedSrcGen();
      this._source[0] = this._getBufferSource(0, true);
      this._source[1] = this._getBufferSource(1);
      this._source[0].connect(this._spectrogram.analyser);
    } else {
      this._audioSrc = source;
      navigator.mediaDevices.getUserMedia({audio: true}).then( stream => {
        this._source[0] = this._context.createMediaStreamSource(stream);
        this._source[0].connect(this._spectrogram.analyser);
      }).catch( err => {
        console.log("Get user media error:" + err)
      });
    }
  }
  _setupBufferedSrcGen() {
    this._now = new Date();
    this._rounded = new Date(Math.floor(this._now.getTime() / AudioConvolver.BUFFER_LENGTH) * AudioConvolver.BUFFER_LENGTH);
    this._count = 2;
  }
  async setup(source, spectrogramContainer) {
    this._createContext();
    this._createSpectrogram(spectrogramContainer);
    this._createSource(source);
    this._buffers = await this.buffersPromises
    .then(buffers => this._decodeBuffersArray(buffers));
    this._createConvolver();
  }
  constructor() {
    this.impulseIdx = -1;
    this._convolverConnected = false;
    this.buffersPromises = this._loadImpulses();
  }
}
