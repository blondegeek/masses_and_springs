export class SphereManager {
    constructor(scene, physicsManager) {
        this.scene = scene;
        this.physicsManager = physicsManager;
        this.bodies = [];
    }

    addSphere(name = "sphere", x = 0, y = 1, z = 0) {
        const sphere = BABYLON.Mesh.CreateSphere(name, 16, 2, this.scene);
        sphere.physicsImpostor = new BABYLON.PhysicsImpostor(
            sphere,
            BABYLON.PhysicsImpostor.SphereImpostor,
            { mass: 1, restitution: 0.9, friction: 10 },
            this.scene
        );
        
        sphere.joints = [];
        this.bodies.push(sphere.physicsImpostor);
        sphere.position.x = x;
        sphere.position.y = y;
        sphere.position.z = z;
        sphere.sphere = true;
        
        return sphere;
    }

    deleteSphere(sphere) {
        const bodyIndex = this.bodies.indexOf(sphere.physicsImpostor);
        if (bodyIndex > -1) {
            this.bodies.splice(bodyIndex, 1);
        }
        sphere.dispose();
    }

    mergeSpheres(spheresToMerge, onJointCreated, onJointDeleted) {
        if (spheresToMerge.length < 2) {
            console.log("Select at least two spheres to merge.");
            return;
        }

        const target = spheresToMerge[0];
        const others = spheresToMerge.slice(1);

        const jointsToAdd = [];
        const jointsToDelete = new Set();

        others.forEach(sphere => {
            sphere.joints.slice().forEach(joint => {
                const start = joint.start_mesh;
                const end = joint.end_mesh;

                let otherMesh = null;
                if (spheresToMerge.includes(start) && !spheresToMerge.includes(end)) {
                    otherMesh = end;
                } else if (spheresToMerge.includes(end) && !spheresToMerge.includes(start)) {
                    otherMesh = start;
                }

                if (otherMesh) {
                    jointsToAdd.push({
                        other: otherMesh,
                        length: joint.physicsJoint.restLength,
                        stiffness: joint.physicsJoint.stiffness,
                        damping: joint.physicsJoint.damping
                    });
                }

                jointsToDelete.add(joint);
            });
        });

        jointsToDelete.forEach(joint => {
            onJointDeleted(joint);
        });

        jointsToAdd.forEach(info => {
            onJointCreated(target, info.other, info.length, info.stiffness, info.damping);
        });

        others.forEach(sphere => {
            this.deleteSphere(sphere);
        });

        const avg = new BABYLON.Vector3(0, 0, 0);
        spheresToMerge.forEach(s => avg.addInPlace(s.position));
        avg.scaleInPlace(1 / spheresToMerge.length);
        target.position.copyFrom(avg);

        console.log(`Merged ${spheresToMerge.length} spheres into one.`);
    }

    getBodies() {
        return this.bodies;
    }
}