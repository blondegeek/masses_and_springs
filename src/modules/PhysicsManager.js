export class PhysicsManager {
    constructor() {
        this.frictionStrength = 1.05;
    }

    applyFriction(bodies) {
        bodies.forEach(body => {
            const objVelocity = body.getLinearVelocity();
            const velocityVector = Object.keys(objVelocity).map(key => objVelocity[key]);
            
            if (window.math.norm(velocityVector) > 0.0) {
                body.setLinearVelocity(
                    new BABYLON.Vector3(
                        body.getLinearVelocity().x / this.frictionStrength,
                        body.getLinearVelocity().y / this.frictionStrength,
                        body.getLinearVelocity().z / this.frictionStrength
                    )
                );
            }
        });
    }

    setFrictionStrength(strength) {
        this.frictionStrength = strength;
    }

    getFrictionStrength() {
        return this.frictionStrength;
    }
}