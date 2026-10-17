/**
 * Vehicles, seen from above: steered like a car (up/down is gas and reverse, left/right turns while
 * it rolls). Top speed, acceleration and handling are the vehicle's stats; the rest is tuned here.
 */
import { DEFAULT_DRIVE, type DriveDefinition } from '@hello-eme/play-schema';
import { advance, fall, follow } from './space.js';
import { statOf } from './stats.js';
import type { Body, World } from './types.js';

/** What stays the same for every vehicle; how it handles is `drive` in its definition. */
export const CAR = {
	/** How close the figure has to be to get in. */
	reach: 48,
	/** Tires leave marks from this drift angle (rad) and speed (px/s) on. */
	skidAngle: 0.25,
	skidSpeed: 60
} as const;

/** How the vehicle handles (the car's way when its definition is gone). */
export function driveOf(world: World, vehicle: Body): DriveDefinition {
	return world.config.entities[vehicle.def]?.drive ?? DEFAULT_DRIVE;
}

function approach(value: number, target: number, rate: number): number {
	return value < target ? Math.min(value + rate, target) : Math.max(value - rate, target);
}

/** Steers the vehicle with the controls for `dt` seconds. */
export function drive(world: World, vehicle: Body, dt: number): void {
	const { axis, drift: handbrake } = world.controls;
	if (world.view === 'side') return driveSide(world, vehicle, dt, axis.x);
	const car = driveOf(world, vehicle);
	const maxSpeed = statOf(world, vehicle, 'speed');
	const accelerate = statOf(world, vehicle, 'accel');
	const turnRate = statOf(world, vehicle, 'handling');
	// Up (y = -1) is gas, down is brake and then reverse.
	const throttle = -axis.y;
	let speed = vehicle.speed;
	if (throttle > 0) speed = approach(speed, maxSpeed, (speed < 0 ? car.brake : accelerate) * dt);
	else if (throttle < 0)
		speed = approach(speed, -car.reverse, (speed > 0 ? car.brake : accelerate) * dt);
	else speed = approach(speed, 0, car.roll * dt);
	if (handbrake) speed = approach(speed, 0, car.handbrakeDrag * dt);

	const turn = axis.x * turnRate * (handbrake ? car.handbrakeTurn : 1) * (speed / maxSpeed) * dt;
	const heading = vehicle.angle + turn;
	// The direction of travel keeps where it was going and only slowly follows the front.
	const grip = handbrake ? car.slideGrip : car.grip;
	const sliding = (vehicle.drift - turn) * Math.exp(-grip * dt);
	const drift = Math.max(-car.maxDrift, Math.min(car.maxDrift, sliding));
	const course = heading + drift;
	advance(
		world,
		vehicle,
		Math.cos(course) * speed * dt,
		Math.sin(course) * speed * dt,
		world.config.game.wrap
	);
	vehicle.angle = heading;
	vehicle.speed = speed;
	vehicle.drift = drift;
	vehicle.moving = Math.abs(speed) > 1;
	follow(world, vehicle.x, vehicle.y);
}

/** Side view: left/right drives along the ground. */
function driveSide(world: World, vehicle: Body, dt: number, steer: number): void {
	const maxSpeed = statOf(world, vehicle, 'speed');
	const accelerate = statOf(world, vehicle, 'accel');
	vehicle.speed =
		steer === 0
			? approach(vehicle.speed, 0, driveOf(world, vehicle).roll * dt)
			: approach(vehicle.speed, steer * maxSpeed, accelerate * dt);
	if (vehicle.speed !== 0) vehicle.angle = vehicle.speed > 0 ? 0 : Math.PI;
	vehicle.drift = 0;
	advance(world, vehicle, vehicle.speed * dt, 0, world.config.game.wrap);
	vehicle.moving = Math.abs(vehicle.speed) > 1;
	fall(world, vehicle, dt);
	follow(world, vehicle.x, vehicle.y);
}

/** Whether the tires slide enough to leave marks. */
export function isSkidding(vehicle: Pick<Body, 'drift' | 'speed'>): boolean {
	return Math.abs(vehicle.drift) >= CAR.skidAngle && Math.abs(vehicle.speed) >= CAR.skidSpeed;
}

/** The rear wheels (they leave the marks), from the vehicle's center and heading. */
export function rearWheels(
	vehicle: Pick<Body, 'x' | 'y' | 'angle'>,
	size = 90
): [{ x: number; y: number }, { x: number; y: number }] {
	const back = -0.3 * size;
	const wheel = (side: number) => ({
		x: vehicle.x + Math.cos(vehicle.angle) * back - Math.sin(vehicle.angle) * side,
		y: vehicle.y + Math.sin(vehicle.angle) * back + Math.cos(vehicle.angle) * side
	});
	return [wheel(-0.2 * size), wheel(0.2 * size)];
}

/** Where the figure stands after getting out: beside the driver's door (left of the car). */
export function doorSide(
	vehicle: Pick<Body, 'x' | 'y' | 'angle'>,
	size = 90
): { x: number; y: number } {
	const side = vehicle.angle - Math.PI / 2;
	const away = size * 0.45;
	return { x: vehicle.x + Math.cos(side) * away, y: vehicle.y + Math.sin(side) * away };
}

/** A vehicle driving by itself along a route of spots (arriving, leaving). Returns true when done. */
export function autopilot(world: World, vehicle: Body, dt: number): boolean {
	const pilot = vehicle.pilot;
	if (!pilot) return true;
	if (pilot.pause > 0) {
		pilot.pause -= dt;
		vehicle.speed = 0;
		vehicle.moving = false;
		return false;
	}
	const target = pilot.targets[0];
	if (!target) {
		vehicle.pilot = undefined;
		vehicle.speed = 0;
		vehicle.moving = false;
		return true;
	}
	const dx = target.x - vehicle.x;
	const dy = target.y - vehicle.y;
	const left = Math.hypot(dx, dy);
	if (left <= 8) {
		pilot.targets.shift();
		pilot.pause = pilot.targets.length > 0 ? 1.2 : 0;
		if (pilot.targets.length === 0) vehicle.pilot = undefined;
		vehicle.speed = 0;
		vehicle.moving = false;
		return pilot.targets.length === 0;
	}
	const speed = Math.min(statOf(world, vehicle, 'speed') * 0.55, 80 + left * 3);
	const step = Math.min(left, speed * dt);
	vehicle.angle = Math.atan2(dy, dx);
	vehicle.x += (dx / left) * step;
	vehicle.y += (dy / left) * step;
	vehicle.speed = speed;
	vehicle.moving = true;
	vehicle.distance += step;
	return false;
}
