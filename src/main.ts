import { Application } from './application';
import { Breakout } from './breakout';
import './style.css'


console.log(Application.fromDescriptor(Breakout).start());