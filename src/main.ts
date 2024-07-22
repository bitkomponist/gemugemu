import { Breakout } from '~/breakout';
import { Application } from '~/gg/application';
import './style.css';

console.log(Application.fromDescriptor(Breakout).start());
