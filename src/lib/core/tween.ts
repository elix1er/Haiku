import { UT } from './utils';

class TweenAbstract<T> {
  times: Array<number>;
  values: Array<T>;
  fns: Array<Function>;
  defaultFn: Function;

  constructor(times: Array<number>, values: Array<T>, defaultFn: Function, fns: Array<Function> = []) {
    this.times = times;
    this.values = values;
    this.fns = fns;
    this.defaultFn = defaultFn;
  }

  interpolate(t: number): T {
    let i = 0;
    let n = this.times.length;

    while (i < n && t > this.times[i]) i++;
    if (i == 0) return this.values[0];
    if (i == n) return this.values[n - 1];

    const beginValue = this.values[i - 1];
    const endValue = this.values[i];
    const currentT = t - this.times[i - 1];
    const currentDuration = this.times[i] - this.times[i - 1];

    if (this.fns[i]) {
      return this.fns[i](currentT, beginValue, endValue, currentDuration);
    }

    return this.defaultFn(currentT, beginValue, endValue, currentDuration);
  }

  isEmpty(): boolean {
    return this.times.length == 0 || this.values.length == 0;
  }
}

class TweenNumber extends TweenAbstract<number> {
  constructor(times: Array<number> = [], values: Array<number> = []) {
    super(times, values, UT.LINEAR);
  }
}

class TweenVEC2 extends TweenAbstract<vec2> {
  constructor(times: Array<number> = [], values: Array<vec2> = []) {
    super(times, values, UT.LINEAR_VEC2);
  }
}

class TweenVEC3 extends TweenAbstract<vec3> {
  constructor(times: Array<number> = [], values: Array<vec3> = []) {
    super(times, values, UT.LINEAR_VEC3);
  }
}

export { TweenNumber, TweenVEC2, TweenVEC3 };