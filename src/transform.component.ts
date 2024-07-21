import { Component, InstantiableComponent } from "./component";
import { Vector2 } from "./math";

export @InstantiableComponent() class Transform extends Component {
  position: Vector2 = { x: 0, y: 0 };
  scale: Vector2 = { x: 1, y: 1 };
  rotation = 0;
  pivot: Vector2 = { x: 0, y: 0 };
}