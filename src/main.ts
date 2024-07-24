import { Application } from '@gg/application';
import "reflect-metadata";
import { Breakout } from '~/breakout';
import './style.css';

Application.fromDescriptor(Breakout).start();
