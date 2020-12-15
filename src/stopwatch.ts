import { TermPlugin } from './terminal/types';

export class Stopwatch {
  timeBegan: Date | null = null;
  timeStopped: Date | null = null;
  stoppedDuration = 0;
  started: NodeJS.Timeout | null = null;

  start() {
    if (this.timeBegan === null) this.timeBegan = new Date();
    if (this.timeStopped !== null)
      this.stoppedDuration += new Date().getTime() - this.timeStopped.getTime();
    this.started = setInterval(this.clockRunning.bind(this), 10);
  }

  stop() {
    this.timeStopped = new Date();
    clearInterval(this.started!);
  }

  reset() {
    clearInterval(this.started!);
    this.stoppedDuration = 0;
    this.timeBegan = null;
    this.timeStopped = null;
    document.getElementById('clock')!.innerHTML = '00:00:00.000';
  }

  clockRunning() {
    const currentTime = new Date(),
      timeElapsed = new Date(
        currentTime.getTime() - this.timeBegan!.getTime() - this.stoppedDuration
      ),
      hour = timeElapsed.getUTCHours(),
      min = timeElapsed.getUTCMinutes(),
      sec = timeElapsed.getUTCSeconds(),
      ms = timeElapsed.getUTCMilliseconds();

    document.getElementById('clock')!.innerHTML =
      (hour > 9 ? hour : '0' + hour) +
      ':' +
      (min > 9 ? min : '0' + min) +
      ':' +
      (sec > 9 ? sec : '0' + sec) +
      '.' +
      (ms > 99 ? ms : ms > 9 ? '0' + ms : '00' + ms);
  }
}

export class StopwatchPlugin implements TermPlugin {
  constructor(public stopwatch: Stopwatch) {}

  onExecuteStarted() {
    if (!this.stopwatch.timeBegan) this.stopwatch.start();
  }
  onExecuteCompleted() {}
}
