define(['lib/three', 'lib/FirstPersonControls', 'riddle_renderer', 'resource',          'tools',    'screen'],
function(three,       first_person_controls,     RiddleRenderer,    ResourceManager,    tools,      Screen) {

    var CUBE_SIZE = 200; //px

    var Scene = function () {
        this.pause = true;
        this.gameEnded = false;

        this.fov = 70;

        this.camera = new THREE.PerspectiveCamera( this.fov, window.innerWidth / window.innerHeight, 1, 10000 );
        this.controls = new THREE.FirstPersonControls( this.camera );
        this.clock = new THREE.Clock();

        this.renderer = new THREE.WebGLRenderer({antialias:true});
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.setClearColor( 0x000000, 1 );

        this.projector = new THREE.Projector();
        this.raycaster = new THREE.Raycaster();

        this.resman = new ResourceManager();
        this.resourceManager = this.resman.getResMan();
        this.resourceManager['cube_size'] = CUBE_SIZE; // remove that and all is lost
        this.resourceManager['renderer'] = this.renderer; // remove that and all is lost
        this.resman.loadAll();

        // sounds
        this.resman.loadSounds();

        this.sound = function (resource) {
            return this.resman.get('sound', resource);
        }

        document.body.appendChild( this.renderer.domElement );
    };

    Scene.prototype.init = function (level) {
        this.level = level;
        this.gameEnded = false;

        var exit = this.level.objects.exit;
        var entrance = this.level.objects.entrance;

        this.sound('main_theme').loop().play();
        this.currentlyPlayingMusic = this.sound('main_theme');

        this.gardiansMap = [];
        for (var i = 0; i < this.level.map.length; i++) {
            this.gardiansMap[i] = [];
            for (var j = 0; j < this.level.map[0].length; j++) {
                this.gardiansMap[i][j] = 0;
            }
        }

        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog( 0x000000, 1, CUBE_SIZE * 5 );
        this.scene.add( new THREE.AmbientLight( 0x444444 ) );
        //this.torchLight = new THREE.PointLight( 0xffffff, 1, CUBE_SIZE * 1.5 );
        //this.scene.add(this.torchLight);

        this.lights = [];
        for(var n=0; n<5; ++n) {
            var light = new THREE.PointLight( 0xffffff, 1, CUBE_SIZE * 2.0 );
            light.visible = false;
            light.frustumCulled = false;
            this.scene.add(light);
            this.lights.push(light);
        }

        // Place camera.
        this.camera.position.x = CUBE_SIZE * entrance[0];
        this.camera.position.y = 0;
        this.camera.position.z = CUBE_SIZE * entrance[1];

        this.controls.lon = this.level.properties.startLon;
        this.controls.movementSpeed = 5000;
        this.controls.lookSpeed = 10.0;
        this.controls.noFly = true;
        this.controls.lookVertical = true;
        this.controls.activeLook = true;
        this.controls.mouseDragOn = false;

        this.INTERSECTED = null;

        this.queueMovement = [];
        this.queuePath = [];
        this.translationSpeed = 10;
        this.rotationSpeed = 10;

        this.animCounter = 0;
        this.nbFramePerAnim = 5;
        this.pnjArray = [];
        this.indiceMeshGround = null;

        this.frameId = 0;

        // array with the direction toward the exit for every tile
        this.arrayTowardExit = [];
        for (var i = 0; i < this.level.width; ++i) {
            var line = [];
            for (var j = 0; j < this.level.height; ++j) {
                line.push([0,0]);
            }
            this.arrayTowardExit.push(line);
        }

        for (var j = 0; j < this.level.height; ++j) {
            for (var i = 0; i < this.level.width; ++i) {

                // wall
                if (this.level.map[i][j]) {
                    if (exit[0] == i && exit[1] == j) {
                        for(var orientation = 0; orientation < 4; ++orientation) {
                            mesh = new THREE.Mesh( this.resourceManager['door_geom'], this.resourceManager['mat_door'] );
                            mesh.frustumCulled = false;
                            mesh.name = "exit";
                            switch(orientation)
                            {
                                case 0:
                                    mesh.position.set(i * CUBE_SIZE, 0, (j+0.52) * CUBE_SIZE);
                                    mesh.rotation.y = 0;
                                    break;
                                case 1:
                                    mesh.position.set(i * CUBE_SIZE, 0, (j-0.52) * CUBE_SIZE);
                                    mesh.rotation.y = Math.PI;
                                    break;
                                case 2:
                                    mesh.position.set((i-0.52) * CUBE_SIZE, 0, j * CUBE_SIZE);
                                    mesh.rotation.y = -Math.PI*0.5;
                                    break;
                                case 3:
                                    mesh.position.set((i+0.52) * CUBE_SIZE, 0, j * CUBE_SIZE);
                                    mesh.rotation.y = Math.PI*0.5;
                                    break;
                                default:
                                    break;
                            }
                            this.scene.add( mesh );
                        }
                    }

                    mesh = new THREE.Mesh( this.resourceManager['cube'], this.resourceManager['mat_wall'] );
                    mesh.frustumCulled = false;
                    mesh.name = "wall";
                    mesh.position.set(i * CUBE_SIZE, 0, j * CUBE_SIZE);
                    this.scene.add( mesh );
                }
                else
                {
                    // floor
                    var mesh = new THREE.Mesh( this.resourceManager['quad_geom'], this.resourceManager['mat_floor'].clone() );
                    mesh.frustumCulled = false;
                    mesh.name = "floor";
                    mesh.position.set(i * CUBE_SIZE, -CUBE_SIZE*0.5, j * CUBE_SIZE)
                    mesh.rotation.x = -Math.PI*0.5;
                    this.scene.add( mesh );

                    // roof
                    mesh = new THREE.Mesh( this.resourceManager['quad_geom'], this.resourceManager['mat_roof'] );
                    mesh.frustumCulled = false;
                    mesh.name = "roof";
                    mesh.position.set(i * CUBE_SIZE, CUBE_SIZE*0.5, j * CUBE_SIZE);
                    mesh.rotation.x = Math.PI*0.5;
                    this.scene.add( mesh );

                    // light
                    if((i+j) % 2) {
                        mesh = new THREE.Mesh( this.resourceManager['light_geom'], this.resourceManager['mat_light'] );
                        mesh.frustumCulled = false;
                        mesh.name = "roof_light";
                        mesh.position.set(i * CUBE_SIZE, CUBE_SIZE/2.1, j * CUBE_SIZE);
                        mesh.rotation.x = Math.PI/2;
                        this.scene.add( mesh );

                        //var light = new THREE.PointLight( 0xffffff, 1, CUBE_SIZE*1.5 );
                        //light.position.set( i * CUBE_SIZE, CUBE_SIZE/2.5, j * CUBE_SIZE );
                        //this.scene.add( light );
                    }

                    // random prop
                    if(i>0 && i<this.level.width && j>0 && j<this.level.height) {
                        for(var orientation = 0; orientation < 4; ++orientation) {
                            var id = tools.getRandomInt(0,4);
                            var mesh;
                            if(id == 0) {
                                mesh = new THREE.Mesh( this.resourceManager["door_geom"], this.resourceManager["mat_deco"+id] );
                            }
                            else {
                                mesh = new THREE.Mesh( this.resourceManager["quad_geom"], this.resourceManager["mat_deco"+id] );
                            }
                            mesh.name = "prop";
                            mesh.frustumCulled = false;
                            switch(orientation)
                            {
                                case 0:
                                    if(this.level.map[i-1][j] && exit[0] != i-1 && exit[1] != j && Math.random() < 0.25) {
                                        mesh.position.set((i-0.48) * CUBE_SIZE, 0, j * CUBE_SIZE);
                                        mesh.rotation.y = Math.PI*0.5;
                                        this.scene.add( mesh );
                                    }
                                    break;
                                case 1:
                                    if(this.level.map[i+1][j] && exit[0] != i+1 && exit[1] != j && Math.random() < 0.25) {
                                        mesh.position.set((i+0.48) * CUBE_SIZE, 0, j * CUBE_SIZE);
                                        mesh.rotation.y = -Math.PI*0.5;
                                        this.scene.add( mesh );
                                    }
                                    break;
                                case 2:
                                    if(this.level.map[i][j+1] && exit[0] != i && exit[1] != j+1 && Math.random() < 0.25) {
                                        mesh.position.set(i * CUBE_SIZE, 0, (j+0.48) * CUBE_SIZE);
                                        mesh.rotation.y = Math.PI;
                                        this.scene.add( mesh );
                                    }
                                    break;
                                case 3:
                                    if(this.level.map[i][j-1] && exit[0] != i && exit[1] != j-1 && Math.random() < 0.25) {
                                        mesh.position.set(i * CUBE_SIZE, 0, (j-0.48) * CUBE_SIZE);
                                        mesh.rotation.y = 0;
                                        this.scene.add( mesh );
                                    }
                                    break;
                                default:
                                    break;
                            }
                        }
                    }

                    // crossroads
                    if(this.detectCrossroad(i * CUBE_SIZE, j * CUBE_SIZE)) {

                        // guardians
                        var gardian = this.level.gardians.getRandomGardian();
                        this.gardiansMap[i][j] = gardian;

                        var mesh;
                        mesh = new THREE.Mesh( new THREE.PlaneGeometry( gardian.width, gardian.height ), this.resourceManager["mat_tex_"+gardian.file+0] );
                        mesh.name = "pnj_"+gardian.file;
                        mesh.frustumCulled = false;
                        mesh.position.set( i * CUBE_SIZE, -40, j * CUBE_SIZE );
                        this.scene.add( mesh );

                        mesh = new THREE.Mesh( new THREE.PlaneGeometry( gardian.width, gardian.height ), this.resourceManager["mat_tex_"+gardian.file+"_question"] );
                        mesh.name = "tip_"+gardian.file;
                        mesh.frustumCulled = false;
                        mesh.position.set( i * CUBE_SIZE, -40, j * CUBE_SIZE );
                        this.scene.add( mesh );

                        // curtains
                        for(var orientation = 0; orientation < 4; ++orientation) {
                            mesh = new THREE.Mesh( this.resourceManager["quad_geom"], this.resourceManager["mat_curtain"] );
                            mesh.frustumCulled = false;
                            mesh.name = "curtain";
                            switch(orientation)
                            {
                                case 0:
                                    mesh.position.set(i * CUBE_SIZE, 0, (j+0.48) * CUBE_SIZE);
                                    mesh.rotation.y = 0;
                                    break;
                                case 1:
                                    mesh.position.set(i * CUBE_SIZE, 0, (j-0.48) * CUBE_SIZE);
                                    mesh.rotation.y = Math.PI;
                                    break;
                                case 2:
                                    mesh.position.set((i-0.48) * CUBE_SIZE, 0, j * CUBE_SIZE);
                                    mesh.rotation.y = -Math.PI*0.5;
                                    break;
                                case 3:
                                    mesh.position.set((i+0.48) * CUBE_SIZE, 0, j * CUBE_SIZE);
                                    mesh.rotation.y = Math.PI*0.5;
                                    break;
                                default:
                                    break;
                            }
                            this.scene.add( mesh );
                        }
                    }
                }
            }
        }

        this.pause = false;
        this.animate();
    };

    Scene.prototype.findIntersections = function () {
        // find intersections
        var vector = new THREE.Vector3( this.controls.mouseNormX, this.controls.mouseNormY  , 1 );
        this.projector.unprojectVector( vector, this.camera );

        this.raycaster.set( this.camera.position, vector.sub( this.camera.position ).normalize() );

        var intersects = this.raycaster.intersectObjects( this.scene.children );

        if ( intersects.length > 0 ) {
            var i = 0;
            var obj = null;

            for(i=0; i<intersects.length; ++i) {
                var tmpObj = intersects[i].object;

                if(tmpObj.name == "exit" || tmpObj.name == "floor" || tmpObj.name == "wall") {
                    obj = tmpObj;
                    break;
                }
            }
            // skip sprites
            // while(i < intersects.length && (intersects[ i ].object instanceof THREE.Sprite || intersects[ i ].object.position.y == -CUBE_SIZE*0.4))
            // {
            //     ++i;
            // }
            // console.log("nbintersects : " + intersects.length);
            // console.log(intersects[0].distance);

            if(obj) {
                // change selected cube, remove highligh on previous and set on new
                if ( this.INTERSECTED != obj ) {

                    if ( this.INTERSECTED ) this.INTERSECTED.material.emissive.setHex( this.INTERSECTED.currentHex );

                    this.INTERSECTED = obj;
                    this.INTERSECTED.currentHex = this.INTERSECTED.material.emissive.getHex();
                    if (obj.name != "wall") this.INTERSECTED.material.emissive.setHex( 0x888888 );
                }

                // set movement if we click
                if (this.controls.realClick) {
                    this.controls.realClick = false;
                    if (obj.name != "wall") {
                        if(obj.name == "exit") {
                            // clic on the exit valid only if the camera is close enough
                            var v = new THREE.Vector2(this.camera.position.x - obj.position.x, this.camera.position.z - obj.position.z);
                            if(v.length() < CUBE_SIZE*2) {
                                this.end();
                            }
                        }
                        this.setMovement(this.INTERSECTED.position);
                        // remove indice
                        if(this.indiceMeshGround && (this.queuePath.length != 0)) {
                            this.scene.remove(this.indiceMeshGround);
                        }

                        // // remove npc indice
                        // for(var j=0; j<this.scene.children.length; ++j) {
                        //     var obj2 = this.scene.children[j];
                        //     if(obj2.name.substring(0,3) == "tip") {
                        //         var style = obj2.name.substring(4);
                        //         obj2.material = this.resourceManager["mat_tex_"+style+"_question"];
                        //         //console.log("mat_"+style+"_question");
                        //     }
                        // }
                    }
                }
                else {
                    /// WARNING : nothing to do here anymore
                }
            }
        }
        else {
            if ( this.INTERSECTED ) this.INTERSECTED.material.emissive.setHex( this.INTERSECTED.currentHex );
            //this.INTERSECTED = null;
        }
    };

    Scene.prototype.setMovement = function (target) {
        var oldIndI = Math.round(this.camera.position.x / CUBE_SIZE);
        var oldIndJ = Math.round(this.camera.position.z / CUBE_SIZE);
        var newIndI = Math.round(target.x / CUBE_SIZE);
        var newIndJ = Math.round(target.z / CUBE_SIZE);
        var distance = Math.abs(newIndI - oldIndI) + Math.abs(newIndJ - oldIndJ);
        // check the validity of the target
        if (distance == 0) {
            // invalid move : same tile
            console.log("Invalid move : same tile !!!");
        } else {
            // movement to the targeted tile
            this.addPath(target, distance);
        }
    }

    Scene.prototype.addPath = function (target, distance) {
        var currentPos = [Math.round(this.camera.position.x / CUBE_SIZE), Math.round(this.camera.position.z / CUBE_SIZE)];
        var finish = [target.x / CUBE_SIZE, target.z / CUBE_SIZE];
        this.computePath (currentPos, finish, distance);
    }

    Scene.prototype.computePath = function (start, finish, maxDepth) {
        // end of recursion
        if (maxDepth == 0) {
            // no more move allowed : if (start = finish) : good path
            if ((start[0] == finish[0]) && (start[1] == finish[1])) {
                return true;
            }else
                return false;
        }
        // explore all 4 possible neighbors by recursion
        // [x-1][z]
        var newFinish = [finish[0] - 1, finish[1]];
        if (!this.level.map[newFinish[0]][finish[1]]) {
            if (this.computePath(start, newFinish, maxDepth - 1)){
                this.queuePath.push(finish);
                return true;
            }
        }
        // [x+1][z]
        var newFinish = [finish[0] + 1, finish[1]];
        if (!this.level.map[newFinish[0]][finish[1]]) {
            if (this.computePath(start, newFinish, maxDepth - 1)){
                this.queuePath.push(finish);
                return true;
            }
        }
        // [x][z-1]
        var newFinish = [finish[0], finish[1] - 1];
        if (!this.level.map[newFinish[0]][finish[1]]) {
            if (this.computePath(start, newFinish, maxDepth - 1)){
                this.queuePath.push(finish);
                return true;
            }
        }
        // [x][z+1]
        var newFinish = [finish[0], finish[1] + 1];
        if (!this.level.map[newFinish[0]][finish[1]]) {
            if (this.computePath(start, newFinish, maxDepth - 1)){
                this.queuePath.push(finish);
                return true;
            }
        }
        return false;
    }

    Scene.prototype.addMovement = function (target) {
        // add a list of movement to execute to go to the target tile
        var targetLon = 0;
        var cameraPos = this.camera.position;
        // var target = this.queuePath.shift;
        while (this.controls.lon > 360) {
            this.controls.lon -= 360;
        }
        while (this.controls.lon < 0) {
            this.controls.lon += 360;
        }
        while (this.controls.lat > 360) {
            this.controls.lat -= 360;
        }
        if (Math.abs(cameraPos.z - target[1]) > 0.1) {
            // movement along Z axis
            if (cameraPos.z - target[1] > 0){ // -Z axis
                if (this.controls.lon < 90)
                    targetLon = -90;
                else
                    targetLon = 270;
            }else {                     // +Z axis
                if (this.controls.lon < 270)
                    targetLon = 90;
                else
                    targetLon = 450;
            }
        }else if (Math.abs(cameraPos.x - target[0]) > 0.1) {
            // movement along X axis
            if (cameraPos.x - target[0] > 0){ // -X axis
                targetLon = 180;
            }else {                     // +X axis
                if (this.controls.lon < 180)
                    targetLon = 0;
                else
                    targetLon = 360;
            }
        }
        // add rotation movement toward the target
        this.queueMovement.push(["rotation", [targetLon, 0]]);


        if (this.detectCrossroad(target[0], target[1])){
            // target tile = crossroad -> special movement for the riddle's UI
            this.queueMovement.push(["translation", [(target[0] + 2 * cameraPos.x ) / 3, -20, (target[1] + 2 * cameraPos.z ) / 3]]);
            this.queueMovement.push(["rotation", [targetLon + 30, 0]]);
            this.queueMovement.push(["riddle"]);
            this.queueMovement.push(["rotation", [targetLon, 0]]);
        }else {
            if(this.detectRoadTurn(this.camera.position.x, this.camera.position.z))
                this.roadTurnEvent();
        }
        this.queueMovement.push(["translation", [target[0], 0, target[1]]]);
    }

    Scene.prototype.executeMove = function() {
        if (this.queueMovement.length == 0) {
            // retrieve the next queued movement in queuePath
            if (this.queuePath.length != 0) {
                var newPosition = this.queuePath.shift();
                var newTarget = [newPosition[0] * CUBE_SIZE, newPosition[1] * CUBE_SIZE];
                this.addMovement(newTarget);
            }
        }else {
            // excute the current move (if needed)
            if (this.queueMovement[0][0] == "rotation") {
            // rotation queued
                this.executeRotation();
            }else if (this.queueMovement[0][0] == "translation") {
            // translation queued
                this.executeTranslation();
            }else if (this.queueMovement[0][0] == "riddle") {
            // riddle queued : remove all queued path
                this.queueMovement.shift();
                this.showRiddle(this.queueMovement[1][1][0] / CUBE_SIZE, this.queueMovement[1][1][2] / CUBE_SIZE);
            }else if (this.queueMovement[0][0] == "clear") {
                this.queuePath.length = 0;
                this.queueMovement.length = 0;
                // remove npc indice
                for(var j=0; j<this.scene.children.length; ++j) {
                    var obj2 = this.scene.children[j];
                    if(obj2.name.substring(0,3) == "tip") {
                        var style = obj2.name.substring(4);
                        obj2.material = this.resourceManager["mat_tex_"+style+"_question"];
                    }
                }
            }else { // should never happen : unkwnon key word
                console.log("unkwnon key word in queueMovement !!!");
                this.queueMovement.shift();
            }
        }
    }

    Scene.prototype.executeRotation = function () {
        if (Math.abs(this.queueMovement[0][1][0] - this.controls.lon) < this.rotationSpeed) {
            // longitude close enough to the target : set to the target one
            this.controls.lon = this.queueMovement[0][1][0];
        }else {
            // slowly change the longitude toward the target
            if (this.queueMovement[0][1][0] > this.controls.lon) {
                this.controls.lon += this.rotationSpeed;
            }else {
                this.controls.lon -= this.rotationSpeed;
            }
        }
        if (Math.abs(this.queueMovement[0][1][1] - this.controls.lat) < this.rotationSpeed) {
            // latitude close enough to the target : set to the target one
            this.controls.lat = this.queueMovement[0][1][1];
        }else {
            // slowly change the longitude toward the target
            if (this.queueMovement[0][1][1] > this.controls.lat) {
                this.controls.lat += this.rotationSpeed;
            }else {
                this.controls.lat -= this.rotationSpeed;
            }
        }
        // if arrived a target longitude and lattitude : remove queued move
        if (  (  (this.queueMovement[0][1][1] == this.controls.lat)
              &&  (this.queueMovement[0][1][0] == this.controls.lon))
            || (Math.abs(this.controls.lon) > 720 ) ) {
            this.queueMovement.shift();
        }
    }

    Scene.prototype.executeTranslation = function () {
        if (Math.abs(this.queueMovement[0][1][0] - this.camera.position.x) < this.translationSpeed) {
            // X position close enough to the target : set to the target one
            this.camera.position.x = this.queueMovement[0][1][0];
        }else {
            // slowly change the X position toward the target
            if (this.queueMovement[0][1][0] > this.camera.position.x) {
                this.camera.position.x += this.translationSpeed;
            }else {
                this.camera.position.x -= this.translationSpeed;
            }
        }
        if (Math.abs(this.queueMovement[0][1][1] - this.camera.position.y) < this.translationSpeed) {
            // Y position close enough to the target : set to the target one
            this.camera.position.y = this.queueMovement[0][1][1];
        }else {
            // slowly change the Y position toward the target
            if (this.queueMovement[0][1][1] > this.camera.position.y) {
                this.camera.position.y += this.translationSpeed;
            }else {
                this.camera.position.y -= this.translationSpeed;
            }
        }
        if (Math.abs(this.queueMovement[0][1][2] - this.camera.position.z) < this.translationSpeed) {
            // Z position close enough to the target : set to the target one
            this.camera.position.z = this.queueMovement[0][1][2];
        }else {
            // slowly change the Z position toward the target
            if (this.queueMovement[0][1][2] > this.camera.position.z) {
                this.camera.position.z += this.translationSpeed;
            }else {
                this.camera.position.z -= this.translationSpeed;
            }
        }
        // if arrived at target position : remove queued move
        if (    (this.queueMovement[0][1][0] == this.camera.position.x)
            &&  (this.queueMovement[0][1][1] == this.camera.position.y)
            &&  (this.queueMovement[0][1][2] == this.camera.position.z)) {
            this.queueMovement.shift();
        }
    }

    Scene.prototype.detectCrossroad = function (x , z) { // x, y abxolute world position
        var currentIndI = Math.round(x / CUBE_SIZE);
        var currentIndJ = Math.round(z / CUBE_SIZE);
        var nbAdjacentTile = 0;
        if (!this.level.map[currentIndI][currentIndJ + 1]) ++nbAdjacentTile;
        if (!this.level.map[currentIndI][currentIndJ - 1]) ++nbAdjacentTile;
        if (!this.level.map[currentIndI + 1][currentIndJ]) ++nbAdjacentTile;
        if (!this.level.map[currentIndI - 1][currentIndJ]) ++nbAdjacentTile;

        if (nbAdjacentTile > 2) {
            return true;
        }
        return false;
    };

    Scene.prototype.detectRoadTurn = function (x, z) {
        var currentIndI = Math.round(x / CUBE_SIZE);
        var currentIndJ = Math.round(z / CUBE_SIZE);
        if (   ((!this.level.map[currentIndI + 1][currentIndJ]) && (!this.level.map[currentIndI][currentIndJ + 1]))
            || ((!this.level.map[currentIndI + 1][currentIndJ]) && (!this.level.map[currentIndI][currentIndJ - 1]))
            || ((!this.level.map[currentIndI - 1][currentIndJ]) && (!this.level.map[currentIndI][currentIndJ + 1]))
            || ((!this.level.map[currentIndI - 1][currentIndJ]) && (!this.level.map[currentIndI][currentIndJ - 1])) ) {
            return true;
        }
        return false;
    };

    Scene.prototype.roadTurnEvent = function () {
        // Play some stressing music, only once every 5 turns in average.
        if (Math.random() < 0.2) {
            this.sound('event_stress').play();
        }
    };

    Scene.prototype.showRiddle = function (i, j) {
        // console.log('Showing a riddle');
        var self = this;

        // Pause the game.
        this.pause = true;

        // Start playing the riddle theme.
        buzz.all().stop();
        this.sound('riddle_theme').loop().play();

        var gardian = this.gardiansMap[i][j];
        var riddle = this.level.riddles.getRandomRiddle();

        var riddleRenderer = new RiddleRenderer(
            riddle,
            gardian,
            // Success.
            function () {
                console.log('Success, Motherfucker.');
                var dir = self.getDirection(self.queueMovement[1][1][0], self.queueMovement[1][1][2], true);
                self.showHint(dir);
                self.stopRiddle(riddleRenderer);
            },
            // Failure.
            function () {
                console.log('You failed. Hard. ');
                var dir = self.getDirection(self.queueMovement[1][1][0], self.queueMovement[1][1][2], false);
                self.showHint(dir);
                self.stopRiddle(riddleRenderer);
            }
        );
        riddleRenderer.display();

        // compute the "exitMap" for the whole maze
        var stack = [];
        stack.push(this.level.objects.exit);
        this.computeDirectionTowardExit(stack);
    };

    Scene.prototype.stopRiddle = function (riddleRenderer) {
        var self = this;

        // play riddle end sound
        this.sound('event_riddle_end').play();

        // fade riddle theme to main theme
        this.sound('riddle_theme').stop();

        // Randomly chose what theme to play.
        if (Math.random() < 0.5) {
            this.sound('main_theme').loop().play();
            this.currentlyPlayingMusic = this.sound('main_theme');
        }
        else {
            this.sound('title_theme').loop().play();
            this.currentlyPlayingMusic = this.sound('title_theme');
        }

        // at the end of the 3 seconds, fade out the UI
        setTimeout(function () {
            // start the game again
            self.pause = false;
            riddleRenderer.hide();
        }, 500);
    };

    Scene.prototype.showHint = function (hintDirectionAbs) {
        var currentIndI = Math.round(this.queueMovement[1][1][0] / CUBE_SIZE);
        var currentIndJ = Math.round(this.queueMovement[1][1][2] / CUBE_SIZE);
        var orient = [hintDirectionAbs[0] - currentIndI, hintDirectionAbs[1] - currentIndJ];
        var stringOrientGround;
        var stringOrientNPC = "question";
        var targetCameraLon;
        if ((orient[0] == -1) && (orient[1] ==  0)) {
            targetCameraLon = 180;
            stringOrientGround = "down";
        }else if ((orient[0] ==  1) && (orient[1] ==  0)) {
            targetCameraLon = 0;
            stringOrientGround = "top";
        }else if ((orient[0] ==  0) && (orient[1] == -1)) {
            targetCameraLon = 270;
            stringOrientGround = "right";
        }else if ((orient[0] ==  0) && (orient[1] ==  1)) {
            targetCameraLon = 90;
            stringOrientGround = "left";
        }else {
            // hint tile not next to the current one : should never happen !!!
            console.log("hint unknown !!!");
        }
        // handle some angle tolerance
        // should not have any value not in {-360, -270, -180, -90, 0, 90, 180, 270, 360}
        if (tools.isBetween(targetCameraLon - this.queueMovement[0][1][0], -31,  31) || tools.isBetween(Math.abs(targetCameraLon - this.queueMovement[0][1][0]), 329, 360) ) stringOrientNPC = "top";
        if (tools.isBetween(Math.abs(targetCameraLon - this.queueMovement[0][1][0]), 149, 211) ) stringOrientNPC = "down";
        if (tools.isBetween(targetCameraLon - this.queueMovement[0][1][0],  59, 121) || tools.isBetween(targetCameraLon - this.queueMovement[0][1][0], -301, -239) ) stringOrientNPC = "right";
        if (tools.isBetween(targetCameraLon - this.queueMovement[0][1][0], 239, 301) || tools.isBetween(targetCameraLon - this.queueMovement[0][1][0], -121, -59) ) stringOrientNPC = "left";

        this.indiceMeshGround = new THREE.Mesh( this.resourceManager["quad_geom"], this.resourceManager["mat_tex_arrow"] );
        this.indiceMeshGround.position.x = hintDirectionAbs[0] * CUBE_SIZE;
        this.indiceMeshGround.position.z = hintDirectionAbs[1] * CUBE_SIZE;
        this.indiceMeshGround.position.y = -CUBE_SIZE*0.48;
        this.indiceMeshGround.rotation.x = -Math.PI*0.5;
        this.indiceMeshGround.rotation.z = -targetCameraLon*Math.PI/180.0 + Math.PI*1.5;
        this.scene.add( this.indiceMeshGround );

        // rotate the camera toward hint
        if (targetCameraLon - this.queueMovement[0][1][0] < -180) targetCameraLon += 360;
        if (targetCameraLon - this.queueMovement[0][1][0] > 180)  targetCameraLon -= 360;
        this.queueMovement.push(["rotation", [targetCameraLon, 0]]);
        this.queueMovement.push(["clear"]);

        // show hint NPC :
        for(var i=0; i<this.scene.children.length; ++i) {
            var obj = this.scene.children[i];
            if(obj.name.substring(0,3) == "tip") {
                var style = obj.name.substring(4);
                obj.material = this.resourceManager["mat_tex_"+style+"_"+stringOrientNPC];
            }
        }
    };

    Scene.prototype.getDirection = function (x, z, answer) {
        var currentIndI = Math.round(x / CUBE_SIZE);
        var currentIndJ = Math.round(z / CUBE_SIZE);
        var hintDirectionAbs = [];
        if (answer) {   // the correct answer was given
            hintDirectionAbs.push(currentIndI + this.arrayTowardExit[currentIndI][currentIndJ][0]);
            hintDirectionAbs.push(currentIndJ + this.arrayTowardExit[currentIndI][currentIndJ][1]);
            return hintDirectionAbs;
        }else {         // a wrong answer was given
            var possibleDirection = [];
            var towardExit = this.arrayTowardExit[currentIndI][currentIndJ];
            if ((towardExit[0]!= -1) && (!this.level.map[currentIndI - 1][currentIndJ])) possibleDirection.push([-1, 0]);
            if ((towardExit[0]!=  1) && (!this.level.map[currentIndI + 1][currentIndJ])) possibleDirection.push([ 1, 0]);
            if ((towardExit[1]!= -1) && (!this.level.map[currentIndI][currentIndJ - 1])) possibleDirection.push([ 0,-1]);
            if ((towardExit[1]!=  1) && (!this.level.map[currentIndI][currentIndJ + 1])) possibleDirection.push([ 0, 1]);
            tools.shuffleArray(possibleDirection);
            hintDirectionAbs.push(currentIndI + possibleDirection[0][0]);
            hintDirectionAbs.push(currentIndJ + possibleDirection[0][1]);
            return hintDirectionAbs;
        }
    };

    Scene.prototype.computeDirectionTowardExit = function (stack) {
        // current tile
        var curItem = stack.pop();
        // the road from its (potential) neighbor go toward the current tile
        if ((curItem[0] > 0)
            && (!this.arrayTowardExit[curItem[0] - 1][curItem[1]][0])
            && (!this.arrayTowardExit[curItem[0] - 1][curItem[1]][1])
            && (!this.level.map[curItem[0] - 1][curItem[1]])) {
            // the tile in [x - 1][y] is a tile
            this.arrayTowardExit[curItem[0] - 1][curItem[1]][0] = 1;
            this.arrayTowardExit[curItem[0] - 1][curItem[1]][1] = 0;
            stack.push([curItem[0] - 1, curItem[1]]);
            var curr = curItem[0] - 1;
        }
        if ((curItem[0] < this.level.height - 1)
            && (!this.arrayTowardExit[curItem[0] + 1][curItem[1]][0])
            && (!this.arrayTowardExit[curItem[0] + 1][curItem[1]][1])
            && (!this.level.map[curItem[0] + 1][curItem[1]])) {
            // the tile in [x + 1][y] is a tile
            this.arrayTowardExit[curItem[0] + 1][curItem[1]][0] = -1;
            this.arrayTowardExit[curItem[0] + 1][curItem[1]][1] = 0;
            stack.push([curItem[0] + 1, curItem[1]]);
            var curr = curItem[0] + 1;
        }
        if ((curItem[1] > 0)
            && (!this.arrayTowardExit[curItem[0]][curItem[1] - 1][0])
            && (!this.arrayTowardExit[curItem[0]][curItem[1] - 1][1])
            && (!this.level.map[curItem[0]][curItem[1] - 1])) {
            // the tile in [x-1][y] is a tile
            this.arrayTowardExit[curItem[0]][curItem[1] - 1][0] = 0;
            this.arrayTowardExit[curItem[0]][curItem[1] - 1][1] = 1;
            stack.push([curItem[0], curItem[1] - 1]);
            var curr = curItem[1] - 1;
        }
        if ((curItem[1] < this.level.width - 1)
            && (!this.arrayTowardExit[curItem[0]][curItem[1] + 1][0])
            && (!this.arrayTowardExit[curItem[0]][curItem[1] + 1][1])
            && (!this.level.map[curItem[0]][curItem[1] + 1])) {
            // the tile in [x-1][y] is a tile
            this.arrayTowardExit[curItem[0]][curItem[1] + 1][0] = 0;
            this.arrayTowardExit[curItem[0]][curItem[1] + 1][1] = -1;
            stack.push([curItem[0], curItem[1] +1]);
            var curr = curItem[1] + 1;
        }
        if (stack.length != 0){
            this.computeDirectionTowardExit(stack);
        }
    };

    Scene.prototype.onEnd = function (callback) {
        this.onEndCallback = callback;
        console.log('Setting END callback');
        console.log(callback);
    };

    Scene.prototype.end = function () {
        var self = this;

        if (this.gameEnded) {
            return;
        }

        this.gameEnded = true;
        this.pause = true;

        // Play the door opening sound
        this.sound('door_opening').play();
        this.currentlyPlayingMusic.fadeOut(1000);

        // Fade to black
        var fade = new Screen('fade-to-black');
        fade.display(function () {
            // Play the door banging sound
            self.sound('door_banging').play();

            setTimeout(function () {
                console.log(self.onEndCallback);
                fade.hide();
                self.onEndCallback();
            }, 2000);
        });
    };

    Scene.prototype.animate = function () {
        requestAnimationFrame( this.animate.bind(this) );

        this.animatePNJ();
        // In pause mode, do nothing but wait until the pause mode is stopped.
        // keep the guardian animation
        if (this.pause) {
            this.render();
            return;
        }


        var delta = this.clock.getDelta(),
        time = this.clock.getElapsedTime() * 5;
        this.controls.update(delta);
        this.executeMove();
        if(this.frameId & 1) {
            this.findIntersections();
        }

        this.updateLights();

        this.render();

        // this.stats.update();
    };

    Scene.prototype.updateLights = function () {
        // update corridor lights
        var indI = Math.round(this.camera.position.x / CUBE_SIZE);
        var indJ = Math.round(this.camera.position.z / CUBE_SIZE);
        var posCam = new THREE.Vector2(this.camera.position.x, this.camera.position.z);
        var vecCam = new THREE.Vector2(Math.cos(this.controls.lon*Math.PI/180), Math.sin(this.controls.lon*Math.PI/180));
        posCam.set(posCam.x - vecCam.x*CUBE_SIZE, posCam.y - vecCam.y*CUBE_SIZE); // offset position to avoid poping artifacts

        // clear all lights
        for(var i=0; i<this.lights.length; ++i) {
            this.lights[i].visible = false;
        }

        var lightId = 0;

        // check a square of 7x7 tile around the player
        var width = 3;
        for(var i=indI-width; i<=indI+width; ++i) {
            for(var j=indJ-width; j<=indJ+width; ++j) {

                // stop if all light are used
                if(lightId >= this.lights.length) break;

                // is it corridor ?
                if (i>0 && i<this.level.width && j>0 && j<this.level.height && this.level.map[i][j] == 0) {

                    // is there a light here ?
                    if((i+j) % 2) {
                        var posLight = new THREE.Vector2(i*CUBE_SIZE, j*CUBE_SIZE);
                        var vecLight = posLight;
                        vecLight.sub(posCam);
                        vecLight.normalize();

                        //console.log("vec cam ("+i+", "+j+") : "+vecCam.x+", "+vecCam.y);
                        //console.log("vec light ("+i+", "+j+") : "+vecLight.x+", "+vecLight.y);

                        // is light visible
                        var dotVal = vecLight.dot(vecCam);
                        if(dotVal >= 0 && Math.abs(dotVal) > Math.cos(this.fov*Math.PI/180.0)) {
                            // angle restriction
                            //if(Math.abs(dotVal) < Math.cos(70*Math.PI/180.0)) continue;
                            this.lights[lightId].position.set( i * CUBE_SIZE, CUBE_SIZE/2.5, j * CUBE_SIZE );
                            this.lights[lightId].visible = true;

                            // flickering test. black magic. failed
                            //if( (this.frameId & ~63) % tools.getRandomInt(0,100) == 0) {
                            //    this.lights[lightId].visible = false;
                            //}

                            ++lightId;
                            //console.log("pos : "+i+", "+j+" is visible : ");
                        }
                    }
                }
            }
        }

        // update torch position
        // this.torchLight.position.x = this.camera.position.x;
        // this.torchLight.position.y = this.camera.position.y;
        // this.torchLight.position.z = this.camera.position.z;
    };

    // TODO : framerate independant animation speed (using THREE.clock ?)
    Scene.prototype.animatePNJ = function () {
        ++this.animCounter;
        if(this.animCounter >= (this.nbFramePerAnim * 4)) this.animCounter = 0;

        for(var i=0; i<this.scene.children.length; ++i) {
            var obj = this.scene.children[i];

            // culling
            if(obj.visible == false) continue;

            // animate by switching material
            if(obj.name.substring(0,3) == "pnj") {
                var style = obj.name.substring(4);
                obj.material = this.resourceManager["mat_tex_"+style+Math.floor(this.animCounter/this.nbFramePerAnim)];
                //console.log("mat_tex_"+style+Math.floor(this.animCounter/10));
            }

            if(obj.name.substring(0,3) == "pnj" || obj.name.substring(0,3) == "tip") {
                var posCam = new THREE.Vector2(this.camera.position.x, this.camera.position.z);
                var posPnj = new THREE.Vector2(obj.position.x, obj.position.z);

                var dist = posCam.distanceTo(posPnj);

                // better rotation test
                // var vec = (posPnj.sub(posCam)).normalize();
                // var vec1 = new THREE.Vector2(Math.cos(this.controls.lon*Math.PI/180), Math.sin(this.controls.lon*Math.PI/180));
                // var ang = Math.acos(vec1.dot(vec));
                // obj.rotation.y = -ang-Math.PI*1.5;

                obj.rotation.y = -(this.controls.lon*Math.PI/180)-Math.PI*0.5; // parallel to near plane

                // hide pnj when too close
                if(dist < 50) {
                    obj.visible = false;
                }
                else {
                    obj.visible = true;
                }
            }
        }
    }

    Scene.prototype.culling = function () {
        var posCam = new THREE.Vector2(this.camera.position.x, this.camera.position.z);
        var vecCam = new THREE.Vector2(Math.cos(this.controls.lon*Math.PI/180), Math.sin(this.controls.lon*Math.PI/180));
        posCam.set(posCam.x - vecCam.x*CUBE_SIZE, posCam.y - vecCam.y*CUBE_SIZE); // offset position to avoid poping artifacts

        for(var i=0; i<this.scene.children.length; ++i) {
            var obj = this.scene.children[i];
            if(obj instanceof THREE.Mesh || obj instanceof THREE.PointLight) {
                var posObj = new THREE.Vector2(obj.position.x, obj.position.z);
                var vecObj = posObj;
                vecObj.sub(posCam);
                var norm = vecObj.length();
                vecObj.normalize();
                var dotVal = vecObj.dot(vecCam);
                if(norm < CUBE_SIZE*6 && dotVal > 0 && Math.abs(dotVal) > Math.cos(this.fov*Math.PI/180.0)) {
                    obj.visible = true;
                }
                else {
                    obj.visible = false;
                }
            }
        }
    };

    Scene.prototype.render = function () {
        this.culling();
        this.renderer.render( this.scene, this.camera );

        ++this.frameId;
    };

    return Scene;
});
