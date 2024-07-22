
export class Vector2 {
  constructor(public x: number = 0, public y: number = 0) { }

  set(x: number, y: number) {
    this.x = x;
    this.y = y;
    return this;
  }

  clone() {
    return new Vector2(this.x, this.y);
  }

  multiplyScalar(scalar: number) {
    return new Vector2(
      this.x * scalar,
      this.y * scalar
    );
  }
}

export function vec2(x = 0, y = 0) {
  return new Vector2(x, y);
}