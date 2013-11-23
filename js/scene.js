define(['lib/three', 'lib/Octree', 'lib/FirstPersonControls', 'riddle_renderer', ],
function(three,      octree,        first_person_controls,     RiddleRenderer) {
    console.log(buzz);
    var Scene = function (level) {
        this.level = level;
        this.pause = false;
    };

    // var Sound = function ( sources, radius, volume, loop=false ) {
    //     var audio = document.createElement( 'audio' );
    //     for ( var i = 0; i < sources.length; i ++ ) {
    //         var source = document.createElement( 'source' );
    //         source.src = sources[ i ];
    //         audio.appendChild( source );
    //         audio.loop = loop;
    //     }

    //     this.position = new THREE.Vector3();

    //     this.play = function () {
    //         audio.play();
    //     }

    //     this.update = function ( camera ) {
    //         var distance = this.position.distanceTo( camera.position );
    //         if ( distance <= radius ) {
    //             audio.volume = volume * ( 1 - distance / radius );
    //         } else {
    //             audio.volume = 0;
    //         }
    //     }
    // }

    var CUBE_SIZE = 200; //px

    Scene.prototype.init = function () {
        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 10000 );
        this.camera.position.x = 0;
        this.camera.position.y = 0;
        this.camera.position.z = CUBE_SIZE;

        this.controls = new THREE.FirstPersonControls( this.camera );

        this.controls.movementSpeed = 200;
        this.controls.lookSpeed = 5.0;
        this.controls.noFly = true;
        this.controls.lookVertical = true;
        this.controls.activeLook = true;
        this.controls.mouseDragOn = false;

        this.clock = new THREE.Clock();

        this.scene.fog = new THREE.Fog( 0x000000, 1, 1000 );
        this.scene.add( new THREE.AmbientLight( 0xffffff ) );

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.setClearColor( 0x000000, 1 );

        this.projector = new THREE.Projector();
        this.raycaster = new THREE.Raycaster();
        this.INTERSECTED;

        this.targetPosX = -5;
        this.targetPosZ = -5;
        this.count;
        this.stepLon;
        this.stepLat;
        this.stepTrX;
        this.stepTrZ;
        this.nbStep = 15;

        this.resourceManager = {};

        // sounds
        this.music = new buzz.sound("sound/main_theme.ogg");
        this.music.loop().play();

        // build unitary cube
        this.resourceManager['cube'] = new THREE.CubeGeometry( CUBE_SIZE, CUBE_SIZE, CUBE_SIZE );

        // floor mesh
        var maxAnisotropy = this.renderer.getMaxAnisotropy();
        var texture1 = THREE.ImageUtils.loadTexture( "img/ground_1-1.png" );
        var material1 = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture1 } );
        texture1.anisotropy = maxAnisotropy;
        texture1.wrapS = texture1.wrapT = THREE.RepeatWrapping;
        texture1.repeat.set( 1, 1 );
        this.resourceManager['mat_floor'] = material1;
        this.resourceManager['mesh_floor'] = new THREE.Mesh( this.resourceManager['cube'], material1 );

        // roof mesh
        var texture2 = THREE.ImageUtils.loadTexture( "img/roof_1-1.png" );
        var material2 = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture2 } );
        texture2.anisotropy = maxAnisotropy;
        texture2.wrapS = texture2.wrapT = THREE.RepeatWrapping;
        texture2.repeat.set( 1, 1 );
        this.resourceManager['mat_roof'] = material2;
        this.resourceManager['mesh_roof'] = new THREE.Mesh( this.resourceManager['cube'], material2 );

        // wall mesh
        var texture3 = THREE.ImageUtils.loadTexture( "img/wall_1-1.png" );
        var material3 = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture3 } );
        texture3.anisotropy = maxAnisotropy;
        texture3.wrapS = texture3.wrapT = THREE.RepeatWrapping;
        texture3.repeat.set( 1, 1 );
        this.resourceManager['mat_wall'] = material3;
        this.resourceManager['mesh_wall'] = new THREE.Mesh( this.resourceManager['cube'], material3 );

        for (var i = 0; i < this.level.height; ++i) {
            for (var j = 0; j < this.level.width; ++j) {
                // floor
                //var mesh = this.resourceManager['mesh_floor'];
                var mesh = new THREE.Mesh( this.resourceManager['cube'], this.resourceManager['mat_floor'].clone() );
                mesh.position.x = i * CUBE_SIZE;
                mesh.position.z = j * CUBE_SIZE;
                mesh.position.y = -CUBE_SIZE;
                this.scene.add( mesh );

                // wall
                if (this.level.map[i][j]) {
                    // geometry = new THREE.CubeGeometry( CUBE_SIZE, CUBE_SIZE, CUBE_SIZE );
                    // material = new THREE.MeshBasicMaterial({
                    //     color: 0xff0000 + i * (255 / this.level.height) + j * (255/this.level.width) * 256,
                    //     wireframe: false
                    // });
                    //var mesh = this.resourceManager['mesh_wall'];
                    var mesh = new THREE.Mesh( this.resourceManager['cube'], this.resourceManager['mat_wall'].clone() );
                    mesh.position.x = i * CUBE_SIZE;
                    mesh.position.z = j * CUBE_SIZE;
                    this.scene.add( mesh );
                }

                // roof
                //var mesh = this.resourceManager['mesh_roof'];
                var mesh = new THREE.Mesh( this.resourceManager['cube'], this.resourceManager['mat_roof'].clone() );
                mesh.position.x = i * CUBE_SIZE;
                mesh.position.z = j * CUBE_SIZE;
                mesh.position.y = CUBE_SIZE;
                this.scene.add( mesh );
            };
        };

        document.body.appendChild( this.renderer.domElement );

        this.animate();
    };

    Scene.prototype.findIntersections = function () {
        // find intersections

        var vector = new THREE.Vector3( this.controls.mouseNormX, this.controls.mouseNormY  , 1 );
        //console.log("mouse : "+this.controls.mouseNormX+', '+this.controls.mouseNormY);
        this.projector.unprojectVector( vector, this.camera );

        this.raycaster.set( this.camera.position, vector.sub( this.camera.position ).normalize() );

        var intersects = this.raycaster.intersectObjects( this.scene.children );

        if ( intersects.length > 0 ) {
            //console.log("nbintersects : " + intersects.length);
            //console.log(intersects[0].distance);

            // check cube type, exlude wall and roof
            if(intersects[ 0 ].object.position.y == -CUBE_SIZE) {

                // change selected cube, remove highligh on previous and set on new
                if ( this.INTERSECTED != intersects[ 0 ].object ) {

                    if ( this.INTERSECTED ) this.INTERSECTED.material.emissive.setHex( this.INTERSECTED.currentHex );

                    this.INTERSECTED = intersects[ 0 ].object;
                    this.INTERSECTED.currentHex = this.INTERSECTED.material.emissive.getHex();
                    this.INTERSECTED.material.emissive.setHex( 0xff0000 );
                }

                // set target pos if we click
                if(this.controls.mouseClick) {
                    this.targetPosX = this.INTERSECTED.position.x;
                    this.targetPosZ = this.INTERSECTED.position.z;
                    console.log("click");
                }
                else {
                    this.targetPosX = -5;
                    this.targetPosZ = -5;
                }
            }
        } else { //
            if ( this.INTERSECTED ) this.INTERSECTED.material.emissive.setHex( this.INTERSECTED.currentHex );
            this.INTERSECTED = null;
        }
    }

    Scene.prototype.checkPosition = function() {
        // var savePosX = this.camera.position.x;
        var oldIndI = Math.round(this.camera.position.x / CUBE_SIZE);
        // var savePosZ = this.camera.position.z;
        var oldIndJ = Math.round(this.camera.position.z / CUBE_SIZE);

        var delta = this.clock.getDelta(),
        time = this.clock.getElapsedTime() * 5;
        this.controls.update(delta);

        var newIndI = Math.round(this.targetPosX / CUBE_SIZE);
        var newIndJ = Math.round(this.targetPosZ / CUBE_SIZE);

        // if (newIndI < 0 || newIndI >= this.level.height || newIndJ < 0 || newIndJ >= this.level.width || this.level.map[newIndI][newIndJ]) {
        //     // invalid movement : restore previous position
        //     this.camera.position.x = savePosX;
        //     this.camera.position.z = savePosZ;

        if ((this.targetPosX != -5) && (this.targetPosY != -5)) {
            // clic detected
            if ((Math.abs(newIndI - oldIndI) > 1) || (Math.abs(newIndJ - oldIndJ) > 1)) {
                // invalid movement : more than 1 tile away
                console.log("Invalid move : too far away !!!");
            } else if ((Math.abs(newIndI - oldIndI) == 1) && (Math.abs(newIndJ - oldIndJ) == 1)) {
                // invalid move : diagonal move
                console.log("Invalid move : diagonal move !!!");
            } else if (((newIndI - oldIndI) == 0) && ((newIndJ - oldIndJ) == 0)) {
                // invalid move : same tile
                console.log("Invalid move : same tile !!!");
            } else {
                while (this.controls.lon > 360) {
                    this.controls.lon -= 360;
                }
                while (this.controls.lat > 360) {
                    this.controls.lat -= 360;
                }
                if (oldIndJ - newIndJ) {
                    // movement along Z axis
                    if (oldIndJ - newIndJ > 0){ // -Z axis
                        if (this.controls.lon < 90)
                            this.targetLon = -90;
                        else
                            this.targetLon = 270;
                    }else {                     // +Z axis
                        if (this.controls.lon < 270)
                            this.targetLon = 90;
                        else
                            this.targetLon = 450;
                    }
                }else if (oldIndI - newIndI) {
                    // movement along X axis
                    if (oldIndI - newIndI > 0){ // -X axis
                        this.targetLon = 180;
                    }else {                     // +X axis
                        if (this.controls.lon < 180)
                            this.targetLon = 0;
                        else
                            this.targetLon = 360;
                    }
                }
                this.stepLon = (this.targetLon - this.controls.lon) / this.nbStep;
                this.stepLat = (0 - this.controls.lat) / this.nbStep;
                this.stepTrX = (this.targetPosX - this.camera.position.x) / (2 * this.nbStep);
                this.stepTrZ = (this.targetPosZ - this.camera.position.z) / (2 * this.nbStep);
                if (Math.abs(this.stepLon) < 0.0001) {
                    this.count = this.nbStep;
                }else {
                    this.count = 0;
                }
            }
        }

        if (this.count < 3*this.nbStep) {
            // update camera rotation
            if (this.count < this.nbStep){
                this.controls.lon += this.stepLon;
                this.controls.lat += this.stepLat;
            }else {
                // center the camera position in the next cell's center
                this.camera.position.x += this.stepTrX;
                this.camera.position.z += this.stepTrZ;
            }
            ++this.count;
        }

        this.camera.position.y = 0;

    };

    Scene.prototype.showRiddle = function () {
        var self = this;

        var riddle = this.level.riddles.getRandomRiddle();
        this.pause = true;
        var rid = new RiddleRenderer(riddle, function () {
            console.log('Success, Motherfucker.');
        }, function () {
            console.log('You failed. Hard. ');
            self.pause = false;
        });
        rid.display();
    };

    Scene.prototype.animate = function () {
        requestAnimationFrame( this.animate.bind(this) );

        // In pause mode, do nothing but wait until the pause mode is stopped.
        if (this.pause) {
            return;
        }

        this.checkPosition();

        this.findIntersections();
        this.render();
    };

    Scene.prototype.render = function () {
        this.renderer.render( this.scene, this.camera );
    };

    return Scene;
});
