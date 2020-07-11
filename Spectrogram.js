// Assumes context is an AudioContext defined outside of this class.
// https://github.com/borismus/spectrogram/blob/master/g-spectrogram.js
class Spectrogram {

  formatFreq(freq) {
    return (freq >= 1000 ? (freq/1000).toFixed(1) : Math.round(freq));
  }

  formatUnits(freq) {
    return (freq >= 1000 ? 'KHz' : 'Hz');
  }

  indexToFreq(index) {
    var nyquist = context.sampleRate/2;
    return nyquist/this.getFFTBinCount() * index;
  }

  freqToIndex(frequency) {
    var nyquist = context.sampleRate/2;
    return Math.round(frequency/nyquist * this.getFFTBinCount());
  }

  getFFTBinCount() {
    return this.fftsize / 2;
  }

  onStreamError(e) {
    console.error(e);
  }

  getGrayColor(value) {
    return 'rgb(V, V, V)'.replace(/V/g, 255 - value);
  }

  getFullColor(value) {
    var fromH = 62;
    var toH = 0;
    var percent = value / 255;
    var delta = percent * (toH - fromH);
    var hue = fromH + delta;
    return 'hsl(H, 100%, 50%)'.replace(/H/g, hue);
  }

  // renderTimeDomain() {
  //   var times = new Uint8Array(this.analyser.frequencyBinCount);
  //   this.analyser.getByteTimeDomainData(times);

  //   for (var i = 0; i < times.length; i++) {
  //     var value = times[i];
  //     var percent = value / 256;
  //     var barHeight = this.height * percent;
  //     var offset = this.height - barHeight - 1;
  //     var barWidth = this.width/times.length;
  //     this.ctx.fillStyle = 'black';
  //     this.ctx.fillRect(i * barWidth, offset, 1, 1);
  //   }
  // }

  renderFreqDomain() {
    var freq = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(freq);

    var ctx = this.ctx;
    // Copy the current canvas onto the temp canvas.
    this.tempCanvas.width = this.width;
    this.tempCanvas.height = this.height;
    //console.log(this.$.canvas.height, this.tempCanvas.height);
    var tempCtx = this.tempCanvas.getContext('2d');
    tempCtx.drawImage(this.canvas, 0, 0, this.width, this.height);

    // Iterate over the frequencies.
    for (var i = 0; i < freq.length; i++) {
      var value;
      // Draw each pixel with the specific color.
      if (this.log) {
        logIndex = this.logScale(i, freq.length);
        value = freq[logIndex];
      } else {
        value = freq[i];
      }

      ctx.fillStyle = (this.color ? this.getFullColor(value) : this.getGrayColor(value));

      var percent = i / freq.length;
      var y = Math.round(percent * this.height);

      // draw the line at the right side of the canvas
      ctx.fillRect(this.width - this.speed, this.height - y,
                   this.speed, this.speed);
    }

    // Translate the canvas.
    ctx.translate(-this.speed, 0);
    // Draw the copied image.
    ctx.drawImage(this.tempCanvas, 0, 0, this.width, this.height,
                  0, 0, this.width, this.height);

    // Reset the transformation matrix.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  /**
   * Given an index and the total number of entries, return the
   * log-scaled value.
   */
  logScale(index, total, opt_base) {
    var base = opt_base || 2;
    var logmax = this.logBase(total + 1, base);
    var exp = logmax * index / total;
    return Math.round(Math.pow(base, exp) - 1);
  }

  logBase(val, base) {
    return Math.log(val) / Math.log(base);
  }

  render() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    var didResize = false;
    // Ensure dimensions are accurate.
    if (this.canvas.width != this.width) {
      this.canvas.width = this.width;
      // this.labels.width = this.width;
      didResize = true;
    }
    if (this.canvas.height != this.height) {
      this.canvas.height = this.height;
      // this.$.labels.height = this.height;
      didResize = true;
    }

    //this.renderTimeDomain();
    this.renderFreqDomain();

    // if (this.labels && didResize) {
    //   this.renderAxesLabels();
    // }

    requestAnimationFrame(this.render.bind(this));

    var now = new Date();
    if (this.lastRenderTime_) {
      this.instantaneousFPS = now - this.lastRenderTime_;
    }
    this.lastRenderTime_ = now;
  }

  constructor(context, container) {
    this.controls = false;
    // Log mode.
    this.log = false;
    // Show axis labels, and how many ticks.
    // this.labels = false;
    // this.ticks = 5;
    this.speed = 2;
    // FFT bin size,
    this.fftsize = 2048;
    // this.oscillator = false;
    this.color = true;
    this.canvas = document.createElement('canvas');
    this.tempCanvas = document.createElement('canvas');
    // console.log('Created spectrogram');
    var analyser = context.createAnalyser();
    analyser.smoothingTimeConstant = 0;
    analyser.fftSize = this.fftsize;

    this.analyser = analyser;
    // Setup a timer to visualize some stuff.
    this.ctx = this.canvas.getContext('2d');
    this.render();
    container.appendChild(this.canvas);
  }
}
