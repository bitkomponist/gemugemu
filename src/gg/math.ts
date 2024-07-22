
export class Vector2 {
  constructor(public x: number = 0, public y: number = 0) { }

  set(x: number, y: number) {
    this.x = x;
    this.y = y;
    return this;
  }

  setVector(v: Vector2) {
    this.x = v.x;
    this.y = v.y;
    return this;
  }

  add(v: Vector2) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  sub(v: Vector2) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  multiply(v: Vector2) {
    this.x *= v.x;
    this.y *= v.y;
    return this;
  }

  divide(v: Vector2) {
    this.x /= v.x;
    this.y /= v.y;
    return this;
  }

  multiplyScalar(scalar: number) {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  clone() {
    return new Vector2(this.x, this.y);
  }
}

export function vec2(x = 0, y = 0) {
  return new Vector2(x, y);
}

export function clamp(min: number, max: number, value: number) {
  return Math.min(max, Math.max(min, value));
}