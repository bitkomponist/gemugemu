import "reflect-metadata";
import { Breakout } from '~/breakout';
import { Application } from '~/gg/application';
import './style.css';

Application.fromDescriptor(Breakout).start();
