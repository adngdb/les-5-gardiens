define(['lib/three', 'lib/FirstPersonControls'], function (three, first_person_controls) {
    var Scene = function (level) {
        this.level = level;
    };

    Scene.prototype.init = function () {
        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
        this.camera.position.x = 0;
        this.camera.position.y = 0;
        this.camera.position.z = 200;

        this.controls = new THREE.FirstPersonControls( this.camera );

        this.controls.movementSpeed = 200;
        this.controls.lookSpeed = 1;
        this.controls.noFly = true;
        this.controls.lookVertical = true;
        this.controls.activeLook = true;
        this.controls.mouseDragOn = true;

        for (var i = 0; i < this.level.height; ++i) {
            for (var j = 0; j < this.level.width; ++j) {
                // floor
                geometry = new THREE.CubeGeometry( 200, 200, 200 );
                material = new THREE.MeshBasicMaterial( { color: 0x555555, wireframe: false } );
                var mesh = new THREE.Mesh( geometry, material );
                mesh.position.x = i * 200;
                mesh.position.z = j * 200;
                mesh.position.y = -200;
                this.scene.add( mesh );

                if (this.level.map[i][j]) {
                    geometry = new THREE.CubeGeometry( 200, 200, 200 );
                    material = new THREE.MeshBasicMaterial({
                        color: 0xff0000 + i * (255 / this.level.height) + j * (255/this.level.width) * 256,
                        wireframe: false
                    });
                    var mesh = new THREE.Mesh( geometry, material );
                    mesh.position.x = i*200;
                    mesh.position.z = j*200;
                    this.scene.add( mesh );
                }

                // roof
                geometry = new THREE.CubeGeometry( 200, 200, 200 );
                material = new THREE.MeshBasicMaterial( { color: 0x999999, wireframe: false } );
                var mesh = new THREE.Mesh( geometry, material );
                mesh.position.x = i*200;
                mesh.position.z = j*200;
                mesh.position.y = 200;
                this.scene.add( mesh );
            };
        };

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize( window.innerWidth, window.innerHeight );

        document.body.appendChild( this.renderer.domElement );

        this.animate();
    };

    Scene.prototype.animate = function () {
        requestAnimationFrame( this.animate.bind(this) );
        this.render();
    };

    Scene.prototype.render = function () {
        var SavePosX = this.camera.position.x;
        var SavePosZ = this.camera.position.z;
        this.controls.update(1.0);

        var NewIndI = Math.round(this.camera.position.x / 200.0);
        var NewIndJ = Math.round(this.camera.position.z / 200.0);

        // console.log("indice : " + NewIndI + " , " + NewIndJ);
        if (NewIndI < 0 || NewIndI >= this.level.height || NewIndJ < 0 || NewIndJ >= this.level.width || this.level.map[NewIndI][NewIndJ]) {// invalid movement : restore previous position
            this.camera.position.x = SavePosX;
            this.camera.position.z = SavePosZ;
            // console.log("reset position");

        }
        this.camera.position.y = 0;
        this.renderer.render( this.scene, this.camera );
        // console.log("camera.position.x : "+camera.position.x);
        // console.log("camera.position.y : "+camera.position.y);
        // console.log("camera.position.z : "+camera.position.z);
    };

    return Scene;
});
