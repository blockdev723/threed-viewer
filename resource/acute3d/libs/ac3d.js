/***************************************************************************/
/*   Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
/***************************************************************************/

"use strict";
/**@constructor*/
function AC3D() { return this; }
/*jslint browser: true*/
/*jslint indent: 4 */
/*global THREE, AC3D*/
"use strict";

var color_white = new THREE.Color(0xffffff);
var color_black = new THREE.Color(0x000000);
var color_noTexture = new THREE.Color(0xa1a1a1);// 0x6c6c6c);

AC3D.showWireframe = false;

var vertexShader = [
        "#define USE_MAP",
        THREE.ShaderChunk.map_pars_vertex,
        "void main() {",
        THREE.ShaderChunk.map_vertex,
        '\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n}'
    ].join("\n");

var fragmentShader = [
        "#define USE_MAP",
        "uniform vec3 diffuse;",
        "uniform float opacity;",

        THREE.ShaderChunk.map_pars_fragment,
        "void main() {",

        "       gl_FragColor = vec4(1.0);", //"       gl_FragColor = vec4( diffuse, opacity );",
        THREE.ShaderChunk.map_fragment,
        '}'//'\n\tgl_FragColor = vec4( vUv, 0.0,1.0 );\n}'                        
    ].join("\n");

var attributesMixed = { center: { type: 'v3', boundTo: 'faceVertices', value: [] } };

AC3D.material_noTexture = new THREE.MeshLambertMaterial({
    ambient : color_noTexture,
    shininess : 0,
    side : THREE.DoubleSide
});

AC3D.material_wireframe = new THREE.MeshLambertMaterial({
    ambient : color_black,
    shininess : 0,
    side : THREE.DoubleSide,
    wireframe: true
});

//OFFSET cannot work for lines, so it needs to be applied to the full geometry
AC3D.material_Shader = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsLib.common,
    attributes: attributesMixed,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    side : THREE.DoubleSide,
    polygonOffset: false,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1
});
AC3D.material_Lambert = new THREE.MeshLambertMaterial({
    wrapAround : true,
    color : color_white,
    specular : color_white,
    shininess : 0,
    side : THREE.DoubleSide
});

/**
 * Do not use THREE.ImageLoader, because it adds a cache that is not deleted
 * when I add reuse of loaders and textures on top
 */

//----------------------------------------
//Texture manager
//----------------------------------------
/** @constructor */
AC3D.TextureManager = function () {
    this.instances = [];
    this.createdInstances = 0;
};

AC3D.TextureManager.prototype.unload = function () {
    this.instances = [];
    this.createdInstances = 0;
};


AC3D.TextureManager.prototype.getTexture = function () {
    var texture = this.instances.pop();
    /**
     * Remember: THREE.Texture image should be made null after call to
     * setTexture
     */
    if (texture === undefined) {
        texture = new THREE.Texture(undefined, THREE.Texture.DEFAULT_MAPPING);
        texture.minFilter = THREE.LinearFilter;
        texture.maxFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;

        this.createdInstances += 1;
        // console.log("created TEXTURES = "+this.createdInstances);
    }

    return texture;
};

AC3D.TextureManager.prototype.returnTexture = function (texture) {
    this.instances.push(texture);
    // console.log("free TEXTURES = "+this.instances.length);
};

//----------------------------------------
//Material manager
//----------------------------------------
/** @constructor */
AC3D.MaterialManager = function () {
    this.instances = [];
    this.createdInstances = 0;
};

AC3D.MaterialManager.prototype.unload = function () {
    this.instances = [];
    this.createdInstances = 0;
};


AC3D.MaterialManager.prototype.getMaterial = function () {
    var material = this.instances.pop();

    if (material === undefined) {
        // material = AC3D.material_Lambert.clone();
        material = AC3D.material_Shader.clone();
        material.textureWidth = 0;
        material.textureHeight = 0;
        this.createdInstances += 1;
        // console.log("created MATERIALS = "+this.createdInstances);
    }

    return material;
    //return AC3D.material_Shader;
};

AC3D.MaterialManager.prototype.returnMaterial = function (material) {
    this.instances.push(material);
    // console.log("free MATERIALS = "+this.instances.length);
};

//----------------------------------------
//PagedLOD manager
//----------------------------------------
/** @constructor */
AC3D.PagedLODManager = function () {
    this.instances = [];
    this.createdInstances = 0;
};

AC3D.PagedLODManager.prototype.unload = function () {
    this.instances = [];
    this.createdInstances = 0;
};

AC3D.PagedLODManager.prototype.getPagedLOD = function (root, LODParent,
        subfolder, url, level) {
    var pagedLOD = this.instances.pop();

    if (pagedLOD === undefined) {
        pagedLOD = new AC3D.PagedLOD(root, LODParent, subfolder, url, level);
        this.createdInstances += 1;
        // console.log("created PagedLOD = "+this.createdInstances);
    } else {
        pagedLOD.init(root, LODParent, subfolder, url, level);
    }
    return pagedLOD;
};

AC3D.PagedLODManager.prototype.returnPagedLOD = function (pagedLOD) {
    this.instances.push(pagedLOD);
    // console.log("free PagedLOD = "+this.instances.length);
};

//----------------------------------------
//NODE manager
//----------------------------------------
/** @constructor */
AC3D.NodeManager = function () {
    this.instances = [];
    this.createdInstances = 0;
};

AC3D.NodeManager.prototype.unload = function () {
    this.instances = [];
    this.createdInstances = 0;
};

AC3D.NodeManager.prototype.getNode = function (name) {
    var node = this.instances.pop();

    if (node === undefined) {
        node = new AC3D.Node(name);
        this.createdInstances += 1;
        // console.log("created PagedLOD = "+this.createdInstances);
    } else {
        node.init(name);
    }
    return node;
};

AC3D.NodeManager.prototype.returnNode = function (node) {
    this.instances.push(node);
    // console.log("free PagedLOD = "+this.instances.length);
};

//----------------------------------------
//GROUP manager
//----------------------------------------
/** @constructor */
AC3D.GroupManager = function () {
    this.instances = [];
    this.createdInstances = 0;
};

AC3D.GroupManager.prototype.unload = function () {
    this.instances = [];
    this.createdInstances = 0;
};

AC3D.GroupManager.prototype.getGroup = function () {
    var group = this.instances.pop();

    if (group === undefined) {
        group = new THREE.Group();
        group.matrixAutoUpdate = false;
        this.createdInstances += 1;
        // console.log("created PagedLOD = "+this.createdInstances);
    }

    return group;
};

AC3D.GroupManager.prototype.returnGroup = function (group) {
    this.instances.push(group);
    // console.log("free PagedLOD = "+this.instances.length);
};
/**
 * Global variables: managers
 */

AC3D.textureManager = new AC3D.TextureManager();
AC3D.materialManager = new AC3D.MaterialManager();
AC3D.pagedLODManager = new AC3D.PagedLODManager();
AC3D.nodeManager = new AC3D.NodeManager();
AC3D.groupManager = new AC3D.GroupManager();
/*jslint browser: true*/
/*jslint indent: 4 */
/*jslint todo: true */
/*global THREE, AC3D, Uint16Array*/
"use strict";

/**
 * Global variables
 */
AC3D.toProcessImages = [];
AC3D.toProcessGeometries = [];
AC3D.PROCESS_STATE = { PROCESS_IMAGES: 0, PROCESS_GEOMETRY: 1 };
AC3D.toProcessState = AC3D.PROCESS_STATE.PROCESS_IMAGES;
AC3D.imageID = 0;
AC3D.freeImages = 0;


AC3D.updateDownloads = function () {
    var indexImage, nonNullImages;
    nonNullImages = 0;
    for (indexImage = 0; indexImage < AC3D.toProcessImages.length; indexImage += 1) {
        if (AC3D.toProcessImages[indexImage] !== null) {
            if (AC3D.toProcessImages[indexImage].status === "Loaded") {
                /** do not do node = imageBlob.node in the processDownloads function, node gets overwritten*/
                if (AC3D.toProcessImages[indexImage].texture) {
                    AC3D.toProcessImages[indexImage].node.addTexture(AC3D.toProcessImages[indexImage].texture);
                }
                delete AC3D.toProcessImages[indexImage];
                AC3D.toProcessImages[indexImage] = null;
                AC3D.freeImages += 1;
            }
            nonNullImages += 1;
        } //end for a non-null data
    }
    if (nonNullImages === 0) {
        AC3D.imageID = 0;
    }
};

AC3D.processDownloads = function () {
    var img, geometryBlob, jsonFileData, geometry, indexImage, currentIndex, oldestDate;
    oldestDate = Date.now();
    if (AC3D.toProcessState === AC3D.PROCESS_STATE.PROCESS_IMAGES) {
        AC3D.toProcessState = AC3D.PROCESS_STATE.PROCESS_GEOMETRY;
        if (AC3D.toProcessImages.length > 0) {
            currentIndex = -1;
            for (indexImage = 0; indexImage < AC3D.toProcessImages.length; indexImage += 1) {
                if (AC3D.toProcessImages[indexImage] !== null && AC3D.toProcessImages[indexImage].status === "to load") {
                    if (oldestDate > AC3D.toProcessImages[indexImage].date) {
                        currentIndex = indexImage;
                        oldestDate = AC3D.toProcessImages[indexImage].date;
                    }
                }
            }
            if (currentIndex >= 0) {
                AC3D.toProcessImages[currentIndex].status = "loading";
                //imageBlob = AC3D.toProcessImages.shift();
                img = document.createElement("img");
                img.src = window.URL.createObjectURL(AC3D.toProcessImages[currentIndex].blob);
                img.onload = (function (self, idImage) {
                    return function () {
                        var indexImageArray, currentImageIndex;
                        window.URL.revokeObjectURL(self.src);
                        currentImageIndex = -1;
                        for (indexImageArray = 0; indexImageArray < AC3D.toProcessImages.length; indexImageArray += 1) {
                            if (AC3D.toProcessImages[indexImageArray] !== null && AC3D.toProcessImages[indexImageArray].idImage === idImage) {
                                AC3D.toProcessImages[indexImageArray].status = "Loaded";
                                currentImageIndex = indexImageArray;
                                break;
                            }
                        }
                        if (currentImageIndex === -1) {
                            return;
                        }


                        AC3D.toProcessImages[currentImageIndex].texture = AC3D.textureManager.getTexture();
                        AC3D.toProcessImages[currentImageIndex].texture.image = self;
                        AC3D.toProcessImages[currentImageIndex].texture.needsUpdate = true;
                        AC3D.toProcessImages[currentImageIndex].texture.name = AC3D.toProcessImages[currentImageIndex].name;
                        /** do not do node = imageBlob.node in the processDownloads function, node gets overwritten*/
                        // AC3D.toProcessImages[currentImageIndex].node.addTexture(texture);
                        //console.log("Loaded image "+imageBlob.name);
                        //imageBlob = null;
                    };
                }(img, AC3D.toProcessImages[currentIndex].idImage));
                img.onerror = (function (self, idImage) {
                    return function () {
                        /** TO DO: error: needs to clear the worker and geometry. Should
                         * - count the number of files processed. 
                         * - set a flag to error.
                         * - if error and all files processed: callbackError (?). What if only one file is erroneous?*/
                        var indexImageArray, currentImageIndex;
                        window.URL.revokeObjectURL(self.src);
                        currentImageIndex = -1;
                        for (indexImageArray = 0; indexImageArray < AC3D.toProcessImages.length; indexImageArray += 1) {
                            if (AC3D.toProcessImages[indexImageArray] !== null && AC3D.toProcessImages[indexImageArray].idImage === idImage) {
                                AC3D.toProcessImages[indexImageArray].status = "Loaded";
                                currentImageIndex = indexImageArray;
                                break;
                            }
                        }
                        if (currentImageIndex === -1) {
                            return;
                        }

                        AC3D.toProcessImages[currentImageIndex].onLoadingError("image");
                    };
                }(img, AC3D.toProcessImages[currentIndex].idImage));
            }
        }
    } else {
        AC3D.toProcessState = AC3D.PROCESS_STATE.PROCESS_IMAGES;
        if (AC3D.toProcessGeometries.length > 0) {

            geometryBlob = AC3D.toProcessGeometries.shift();
            jsonFileData = JSON.parse(geometryBlob.blob.header.comment);
            geometry = AC3D.createModel(geometryBlob.blob, jsonFileData.texture);
            //Set bounding sphere data if available
            if (jsonFileData.sphere_center && jsonFileData.sphere_radius) {
                geometry.setBoundingSphere(parseFloat(jsonFileData.sphere_center[0]), parseFloat(jsonFileData.sphere_center[1]), parseFloat(jsonFileData.sphere_center[2]), parseFloat(jsonFileData.sphere_radius));
            }

            geometryBlob.node.addGeometry(geometry, jsonFileData.node);
            //console.log("metadata = "+geometryBlob.blob.header.comment);
        }
    }
};

/**@constructor*/
AC3D.Model = function (file, textureUsed) {
    THREE.BufferGeometry.call(this);
    this.textureUsed = textureUsed;

    var indices, indices_uint16, positions, normals, uvMaps, attrMaps, uvs, colors, index;

    indices = file.body.indices;
    indices_uint16 = new Uint16Array(indices.length);
    for (index = 0; index < indices.length; index += 1) {
        indices_uint16[index] = indices[index];
    }
    positions = file.body.vertices;
    normals = file.body.normals;
    uvMaps = file.body.uvMaps;
    attrMaps = file.body.attrMaps;

    if (uvMaps !== undefined && uvMaps.length > 0) {
        uvs = uvMaps[0].uv;
    }

    if (attrMaps !== undefined && attrMaps.length > 0 && attrMaps[0].name === 'Color') {
        colors = attrMaps[0].attr;
    }
    this.addAttribute('index', new THREE.BufferAttribute(indices_uint16, 1));
    this.addAttribute('position', new THREE.BufferAttribute(positions, 3));
    if (normals !== undefined) {
        this.addAttribute('normal', new THREE.BufferAttribute(normals, 3));
    }
    if (uvs !== undefined) {
        this.addAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    }
    if (colors !== undefined) {
        this.addAttribute('color', new THREE.BufferAttribute(colors, 4));
    }
};

AC3D.Model.prototype = Object.create(THREE.BufferGeometry.prototype);

/** TO DO: re-use buffer geometry?
 * TO DO: deal with error?*/
AC3D.createModel = function (file, textureUsed) {
    var geometry = new AC3D.Model(file, textureUsed);
    //geometry.computeOffsets();
    // compute vertex normals if not present in the CTM model
    /*if (geometry.attributes.normal === undefined) {
        geometry.computeVertexNormals();
    }*/
    return geometry;
};
/*jslint browser: true*/
/*jslint indent: 4 */
/*jslint todo: true */
/*global Worker, AC3D*/
"use strict";

/**
 * Global variables
 */
var MAX_INSTANCES = 4;

//----------------------------------------
//CTMWorker manager
//----------------------------------------
/** @constructor */
AC3D.WorkerManager = function () {
    //keep a copy of all instances, so I can terminate them at any time.
    this.allWorkers = [];
    this.instances = [];
    this.createdInstances = 0;
    this.load();
};

AC3D.WorkerManager.prototype.load = function () {
    this.maxWorkers = MAX_INSTANCES;
    var ww;
    this.unload();
    while (this.allWorkers.length < this.maxWorkers) {
        ww = new Worker("resource/acute3d/libs/ctm/CTMWorker.js");
        this.instances.push(ww);
        this.allWorkers.push(ww);
        this.createdInstances += 1;
    }
};

AC3D.WorkerManager.prototype.unload = function () {
    var worker;
    while (this.allWorkers.length > 0) {
        worker = this.allWorkers.pop();
        worker.terminate();
    }
    this.instances = [];
    this.createdInstances = 0;
};

AC3D.WorkerManager.prototype.getWorker = function () {
    var ww = this.instances.pop();
    return ww;
};

AC3D.WorkerManager.prototype.returnWorker = function (worker) {
    this.instances.push(worker);
    //console.log("free workers = "+this.instances.length+"; this.createdInstances = "+this.createdInstances);
};

/**
 * Terminate and redeclare available workers, because Firefox has a problem with emptying the cache for existing workers
 */
/*
AC3D.WorkerManager.prototype.reinitWorkers  = function () {
    var availableWorkers = this.instances.length;
    var i;
    for(i=0;i<availableWorkers;i++) {
        var ww = this.instances.pop();
        //ww.postMessage("close");
        ww.terminate();
    }
    for(i=0;i<availableWorkers;i++) {
        var ww = new Worker( "resource/acute3d/libs/ctm/CTMWorker.js" );
        this.instances.push(ww);
    }
}
 */
//----------------------------------------
//CTMLoader manager
//----------------------------------------
/** @constructor */
AC3D.CTMLoaderManager = function () {
    this.instances = [];
    this.createdInstances = 0;
};

AC3D.CTMLoaderManager.prototype.unload = function () {
    this.instances = [];
    this.createdInstances = 0;
};

AC3D.CTMLoaderManager.prototype.getLoader = function () {
    var ctmLoader = this.instances.pop();

    if (ctmLoader === undefined) {
        ctmLoader = new AC3D.CTMLoader();
        this.createdInstances += 1;
    }

    return ctmLoader;
};


AC3D.CTMLoaderManager.prototype.returnLoader = function (ctmLoader) {
    ctmLoader.xhr = null;
    this.instances.push(ctmLoader);
    //console.log("free loaders = "+this.instances.length);
};
/*
Copyright (c) 2011 Juan Mellado

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/*
References:
- "OpenCTM: The Open Compressed Triangle Mesh file format" by Marcus Geelnard
  http://openctm.sourceforge.net/
*/

var CTM = CTM || {};

CTM.CompressionMethod = {
  RAW: 0x00574152,
  MG1: 0x0031474d,
  MG2: 0x0032474d
};

CTM.Flags = {
  NORMALS: 0x00000001
};

CTM.File = function(stream){
  this.load(stream);
};

CTM.File.prototype.load = function(stream){
  this.header = new CTM.FileHeader(stream);

  this.body = new CTM.FileBody(this.header);
  
  this.getReader().read(stream, this.body);
};

CTM.File.prototype.getReader = function(){
  var reader;

  switch(this.header.compressionMethod){
    case CTM.CompressionMethod.RAW:
      reader = new CTM.ReaderRAW();
      break;
    case CTM.CompressionMethod.MG1:
      reader = new CTM.ReaderMG1();
      break;
    case CTM.CompressionMethod.MG2:
      reader = new CTM.ReaderMG2();
      break;
  }

  return reader;
};

CTM.FileHeader = function(stream){
  stream.readInt32(); //magic "OCTM"
  this.fileFormat = stream.readInt32();
  this.compressionMethod = stream.readInt32();
  this.vertexCount = stream.readInt32();
  this.triangleCount = stream.readInt32();
  this.uvMapCount = stream.readInt32();
  this.attrMapCount = stream.readInt32();
  this.flags = stream.readInt32();
  this.comment = stream.readString();
};

CTM.FileHeader.prototype.hasNormals = function(){
  return this.flags & CTM.Flags.NORMALS;
};

CTM.FileBody = function(header){
  var i = header.triangleCount * 3,
      v = header.vertexCount * 3,
      n = header.hasNormals()? header.vertexCount * 3: 0,
      u = header.vertexCount * 2,
      a = header.vertexCount * 4,
      j = 0;

  var data = new ArrayBuffer(
    (i + v + n + (u * header.uvMapCount) + (a * header.attrMapCount) ) * 4);

  this.indices = new Uint32Array(data, 0, i);

  this.vertices = new Float32Array(data, i * 4, v);

  if ( header.hasNormals() ){
    this.normals = new Float32Array(data, (i + v) * 4, n);
  }
  
  if (header.uvMapCount){
    this.uvMaps = [];
    for (j = 0; j < header.uvMapCount; ++ j){
      this.uvMaps[j] = {uv: new Float32Array(data,
        (i + v + n + (j * u) ) * 4, u) };
    }
  }
  
  if (header.attrMapCount){
    this.attrMaps = [];
    for (j = 0; j < header.attrMapCount; ++ j){
      this.attrMaps[j] = {attr: new Float32Array(data,
        (i + v + n + (u * header.uvMapCount) + (j * a) ) * 4, a) };
    }
  }
};

CTM.FileMG2Header = function(stream){
  stream.readInt32(); //magic "MG2H"
  this.vertexPrecision = stream.readFloat32();
  this.normalPrecision = stream.readFloat32();
  this.lowerBoundx = stream.readFloat32();
  this.lowerBoundy = stream.readFloat32();
  this.lowerBoundz = stream.readFloat32();
  this.higherBoundx = stream.readFloat32();
  this.higherBoundy = stream.readFloat32();
  this.higherBoundz = stream.readFloat32();
  this.divx = stream.readInt32();
  this.divy = stream.readInt32();
  this.divz = stream.readInt32();
  
  this.sizex = (this.higherBoundx - this.lowerBoundx) / this.divx;
  this.sizey = (this.higherBoundy - this.lowerBoundy) / this.divy;
  this.sizez = (this.higherBoundz - this.lowerBoundz) / this.divz;
};

CTM.ReaderRAW = function(){
};

CTM.ReaderRAW.prototype.read = function(stream, body){
  this.readIndices(stream, body.indices);
  this.readVertices(stream, body.vertices);
  
  if (body.normals){
    this.readNormals(stream, body.normals);
  }
  if (body.uvMaps){
    this.readUVMaps(stream, body.uvMaps);
  }
  if (body.attrMaps){
    this.readAttrMaps(stream, body.attrMaps);
  }
};

CTM.ReaderRAW.prototype.readIndices = function(stream, indices){
  stream.readInt32(); //magic "INDX"
  stream.readArrayInt32(indices);
};

CTM.ReaderRAW.prototype.readVertices = function(stream, vertices){
  stream.readInt32(); //magic "VERT"
  stream.readArrayFloat32(vertices);
};

CTM.ReaderRAW.prototype.readNormals = function(stream, normals){
  stream.readInt32(); //magic "NORM"
  stream.readArrayFloat32(normals);
};

CTM.ReaderRAW.prototype.readUVMaps = function(stream, uvMaps){
  var i = 0;
  for (; i < uvMaps.length; ++ i){
    stream.readInt32(); //magic "TEXC"

    uvMaps[i].name = stream.readString();
    uvMaps[i].filename = stream.readString();
    stream.readArrayFloat32(uvMaps[i].uv);
  }
};

CTM.ReaderRAW.prototype.readAttrMaps = function(stream, attrMaps){
  var i = 0;
  for (; i < attrMaps.length; ++ i){
    stream.readInt32(); //magic "ATTR"

    attrMaps[i].name = stream.readString();
    stream.readArrayFloat32(attrMaps[i].attr);
  }
};

CTM.ReaderMG1 = function(){
};

CTM.ReaderMG1.prototype.read = function(stream, body){
  this.readIndices(stream, body.indices);
  this.readVertices(stream, body.vertices);
  
  if (body.normals){
    this.readNormals(stream, body.normals);
  }
  if (body.uvMaps){
    this.readUVMaps(stream, body.uvMaps);
  }
  if (body.attrMaps){
    this.readAttrMaps(stream, body.attrMaps);
  }
};

CTM.ReaderMG1.prototype.readIndices = function(stream, indices){
  stream.readInt32(); //magic "INDX"
  stream.readInt32(); //packed size
  
  var interleaved = new CTM.InterleavedStream(indices, 3);
  LZMA.decompress(stream, stream, interleaved, interleaved.data.length);

  CTM.restoreIndices(indices, indices.length);
};

CTM.ReaderMG1.prototype.readVertices = function(stream, vertices){
  stream.readInt32(); //magic "VERT"
  stream.readInt32(); //packed size
  
  var interleaved = new CTM.InterleavedStream(vertices, 1);
  LZMA.decompress(stream, stream, interleaved, interleaved.data.length);
};

CTM.ReaderMG1.prototype.readNormals = function(stream, normals){
  stream.readInt32(); //magic "NORM"
  stream.readInt32(); //packed size

  var interleaved = new CTM.InterleavedStream(normals, 3);
  LZMA.decompress(stream, stream, interleaved, interleaved.data.length);
};

CTM.ReaderMG1.prototype.readUVMaps = function(stream, uvMaps){
  var i = 0;
  for (; i < uvMaps.length; ++ i){
    stream.readInt32(); //magic "TEXC"

    uvMaps[i].name = stream.readString();
    uvMaps[i].filename = stream.readString();
    
    stream.readInt32(); //packed size

    var interleaved = new CTM.InterleavedStream(uvMaps[i].uv, 2);
    LZMA.decompress(stream, stream, interleaved, interleaved.data.length);
  }
};

CTM.ReaderMG1.prototype.readAttrMaps = function(stream, attrMaps){
  var i = 0;
  for (; i < attrMaps.length; ++ i){
    stream.readInt32(); //magic "ATTR"

    attrMaps[i].name = stream.readString();
    
    stream.readInt32(); //packed size

    var interleaved = new CTM.InterleavedStream(attrMaps[i].attr, 4);
    LZMA.decompress(stream, stream, interleaved, interleaved.data.length);
  }
};

CTM.ReaderMG2 = function(){
};

CTM.ReaderMG2.prototype.read = function(stream, body){
  this.MG2Header = new CTM.FileMG2Header(stream);
  
  this.readVertices(stream, body.vertices);
  this.readIndices(stream, body.indices);
  
  if (body.normals){
    this.readNormals(stream, body);
  }
  if (body.uvMaps){
    this.readUVMaps(stream, body.uvMaps);
  }
  if (body.attrMaps){
    this.readAttrMaps(stream, body.attrMaps);
  }
};

CTM.ReaderMG2.prototype.readVertices = function(stream, vertices){
  stream.readInt32(); //magic "VERT"
  stream.readInt32(); //packed size

  var interleaved = new CTM.InterleavedStream(vertices, 3);
  LZMA.decompress(stream, stream, interleaved, interleaved.data.length);
  
  var gridIndices = this.readGridIndices(stream, vertices);
  
  CTM.restoreVertices(vertices, this.MG2Header, gridIndices, this.MG2Header.vertexPrecision);
};

CTM.ReaderMG2.prototype.readGridIndices = function(stream, vertices){
  stream.readInt32(); //magic "GIDX"
  stream.readInt32(); //packed size
  
  var gridIndices = new Uint32Array(vertices.length / 3);
  
  var interleaved = new CTM.InterleavedStream(gridIndices, 1);
  LZMA.decompress(stream, stream, interleaved, interleaved.data.length);
  
  CTM.restoreGridIndices(gridIndices, gridIndices.length);
  
  return gridIndices;
};

CTM.ReaderMG2.prototype.readIndices = function(stream, indices){
  stream.readInt32(); //magic "INDX"
  stream.readInt32(); //packed size

  var interleaved = new CTM.InterleavedStream(indices, 3);
  LZMA.decompress(stream, stream, interleaved, interleaved.data.length);

  CTM.restoreIndices(indices, indices.length);
};

CTM.ReaderMG2.prototype.readNormals = function(stream, body){
  stream.readInt32(); //magic "NORM"
  stream.readInt32(); //packed size

  var interleaved = new CTM.InterleavedStream(body.normals, 3);
  LZMA.decompress(stream, stream, interleaved, interleaved.data.length);

  var smooth = CTM.calcSmoothNormals(body.indices, body.vertices);

  CTM.restoreNormals(body.normals, smooth, this.MG2Header.normalPrecision);
};

CTM.ReaderMG2.prototype.readUVMaps = function(stream, uvMaps){
  var i = 0;
  for (; i < uvMaps.length; ++ i){
    stream.readInt32(); //magic "TEXC"

    uvMaps[i].name = stream.readString();
    uvMaps[i].filename = stream.readString();
    
    var precision = stream.readFloat32();
    
    stream.readInt32(); //packed size

    var interleaved = new CTM.InterleavedStream(uvMaps[i].uv, 2);
    LZMA.decompress(stream, stream, interleaved, interleaved.data.length);
    
    CTM.restoreMap(uvMaps[i].uv, 2, precision);
  }
};

CTM.ReaderMG2.prototype.readAttrMaps = function(stream, attrMaps){
  var i = 0;
  for (; i < attrMaps.length; ++ i){
    stream.readInt32(); //magic "ATTR"

    attrMaps[i].name = stream.readString();
    
    var precision = stream.readFloat32();
    
    stream.readInt32(); //packed size

    var interleaved = new CTM.InterleavedStream(attrMaps[i].attr, 4);
    LZMA.decompress(stream, stream, interleaved, interleaved.data.length);
    
    CTM.restoreMap(attrMaps[i].attr, 4, precision);
  }
};

CTM.restoreIndices = function(indices, len){
  var i = 3;
  if (len > 0){
    indices[2] += indices[0];
    indices[1] += indices[0];
  }
  for (; i < len; i += 3){
    indices[i] += indices[i - 3];
    
    if (indices[i] === indices[i - 3]){
      indices[i + 1] += indices[i - 2];
    }else{
      indices[i + 1] += indices[i];
    }

    indices[i + 2] += indices[i];
  }
};

CTM.restoreGridIndices = function(gridIndices, len){
  var i = 1;
  for (; i < len; ++ i){
    gridIndices[i] += gridIndices[i - 1];
  }
};

CTM.restoreVertices = function(vertices, grid, gridIndices, precision){
  var gridIdx, delta, x, y, z,
      intVertices = new Uint32Array(vertices.buffer, vertices.byteOffset, vertices.length),
      ydiv = grid.divx, zdiv = ydiv * grid.divy,
      prevGridIdx = 0x7fffffff, prevDelta = 0,
      i = 0, j = 0, len = gridIndices.length;

  for (; i < len; j += 3){
    x = gridIdx = gridIndices[i ++];
    
    z = ~~(x / zdiv);
    x -= ~~(z * zdiv);
    y = ~~(x / ydiv);
    x -= ~~(y * ydiv);

    delta = intVertices[j];
    if (gridIdx === prevGridIdx){
      delta += prevDelta;
    }

    vertices[j]     = grid.lowerBoundx +
      x * grid.sizex + precision * delta;
    vertices[j + 1] = grid.lowerBoundy +
      y * grid.sizey + precision * intVertices[j + 1];
    vertices[j + 2] = grid.lowerBoundz +
      z * grid.sizez + precision * intVertices[j + 2];

    prevGridIdx = gridIdx;
    prevDelta = delta;
  }
};

CTM.restoreNormals = function(normals, smooth, precision){
  var ro, phi, theta, sinPhi,
      nx, ny, nz, by, bz, len,
      intNormals = new Uint32Array(normals.buffer, normals.byteOffset, normals.length),
      i = 0, k = normals.length,
      PI_DIV_2 = 3.141592653589793238462643 * 0.5;

  for (; i < k; i += 3){
    ro = intNormals[i] * precision;
    phi = intNormals[i + 1];

    if (phi === 0){
      normals[i]     = smooth[i]     * ro;
      normals[i + 1] = smooth[i + 1] * ro;
      normals[i + 2] = smooth[i + 2] * ro;
    }else{
      
      if (phi <= 4){
        theta = (intNormals[i + 2] - 2) * PI_DIV_2;
      }else{
        theta = ( (intNormals[i + 2] * 4 / phi) - 2) * PI_DIV_2;
      }
      
      phi *= precision * PI_DIV_2;
      sinPhi = ro * Math.sin(phi);

      nx = sinPhi * Math.cos(theta);
      ny = sinPhi * Math.sin(theta);
      nz = ro * Math.cos(phi);

      bz = smooth[i + 1];
      by = smooth[i] - smooth[i + 2];

      len = Math.sqrt(2 * bz * bz + by * by);
      if (len > 1e-20){
        by /= len;
        bz /= len;
      }

      normals[i]     = smooth[i]     * nz +
        (smooth[i + 1] * bz - smooth[i + 2] * by) * ny - bz * nx;
      normals[i + 1] = smooth[i + 1] * nz -
        (smooth[i + 2]      + smooth[i]   ) * bz  * ny + by * nx;
      normals[i + 2] = smooth[i + 2] * nz +
        (smooth[i]     * by + smooth[i + 1] * bz) * ny + bz * nx;
    }
  }
};

CTM.restoreMap = function(map, count, precision){
  var delta, value,
      intMap = new Uint32Array(map.buffer, map.byteOffset, map.length),
      i = 0, j, len = map.length;

  for (; i < count; ++ i){
    delta = 0;

    for (j = i; j < len; j += count){
      value = intMap[j];
      
      delta += value & 1? -( (value + 1) >> 1): value >> 1;
      
      map[j] = delta * precision;
    }
  }
};

CTM.calcSmoothNormals = function(indices, vertices){
  var smooth = new Float32Array(vertices.length),
      indx, indy, indz, nx, ny, nz,
      v1x, v1y, v1z, v2x, v2y, v2z, len,
      i, k;

  for (i = 0, k = indices.length; i < k;){
    indx = indices[i ++] * 3;
    indy = indices[i ++] * 3;
    indz = indices[i ++] * 3;

    v1x = vertices[indy]     - vertices[indx];
    v2x = vertices[indz]     - vertices[indx];
    v1y = vertices[indy + 1] - vertices[indx + 1];
    v2y = vertices[indz + 1] - vertices[indx + 1];
    v1z = vertices[indy + 2] - vertices[indx + 2];
    v2z = vertices[indz + 2] - vertices[indx + 2];
    
    nx = v1y * v2z - v1z * v2y;
    ny = v1z * v2x - v1x * v2z;
    nz = v1x * v2y - v1y * v2x;
    
    len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    if (len > 1e-10){
      nx /= len;
      ny /= len;
      nz /= len;
    }
    
    smooth[indx]     += nx;
    smooth[indx + 1] += ny;
    smooth[indx + 2] += nz;
    smooth[indy]     += nx;
    smooth[indy + 1] += ny;
    smooth[indy + 2] += nz;
    smooth[indz]     += nx;
    smooth[indz + 1] += ny;
    smooth[indz + 2] += nz;
  }

  for (i = 0, k = smooth.length; i < k; i += 3){
    len = Math.sqrt(smooth[i] * smooth[i] + 
      smooth[i + 1] * smooth[i + 1] +
      smooth[i + 2] * smooth[i + 2]);

    if(len > 1e-10){
      smooth[i]     /= len;
      smooth[i + 1] /= len;
      smooth[i + 2] /= len;
    }
  }

  return smooth;
};

CTM.isLittleEndian = (function(){
  var buffer = new ArrayBuffer(2),
      bytes = new Uint8Array(buffer),
      ints = new Uint16Array(buffer);

  bytes[0] = 1;

  return ints[0] === 1;
}());

CTM.InterleavedStream = function(data, count){
  this.data = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  this.offset = CTM.isLittleEndian? 3: 0;
  this.count = count * 4;
  this.len = this.data.length;
};

CTM.InterleavedStream.prototype.writeByte = function(value){
  this.data[this.offset] = value;
  
  this.offset += this.count;
  if (this.offset >= this.len){
  
    this.offset -= this.len - 4;
    if (this.offset >= this.count){
    
      this.offset -= this.count + (CTM.isLittleEndian? 1: -1);
    }
  }
};

CTM.Stream = function(data){
  this.data = data;
  this.offset = 0;
};

CTM.Stream.prototype.TWO_POW_MINUS23 = Math.pow(2, -23);

CTM.Stream.prototype.TWO_POW_MINUS126 = Math.pow(2, -126);

CTM.Stream.prototype.readByte = function(){
  return this.data[this.offset ++] & 0xff;
};

CTM.Stream.prototype.readInt32 = function(){
  var i = this.readByte();
  i |= this.readByte() << 8;
  i |= this.readByte() << 16;
  return i | (this.readByte() << 24);
};

CTM.Stream.prototype.readFloat32 = function(){
  var m = this.readByte();
  m += this.readByte() << 8;

  var b1 = this.readByte();
  var b2 = this.readByte();

  m += (b1 & 0x7f) << 16; 
  var e = ( (b2 & 0x7f) << 1) | ( (b1 & 0x80) >>> 7);
  var s = b2 & 0x80? -1: 1;

  if (e === 255){
    return m !== 0? NaN: s * Infinity;
  }
  if (e > 0){
    return s * (1 + (m * this.TWO_POW_MINUS23) ) * Math.pow(2, e - 127);
  }
  if (m !== 0){
    return s * m * this.TWO_POW_MINUS126;
  }
  return s * 0;
};

CTM.Stream.prototype.readString = function(){
  var len = this.readInt32();

  this.offset += len;

  return String.fromCharCode.apply(null,this.data.subarray(this.offset - len, this.offset));
};

CTM.Stream.prototype.readArrayInt32 = function(array){
  var i = 0, len = array.length;
  
  while(i < len){
    array[i ++] = this.readInt32();
  }

  return array;
};

CTM.Stream.prototype.readArrayFloat32 = function(array){
  var i = 0, len = array.length;

  while(i < len){
    array[i ++] = this.readFloat32();
  }

  return array;
};

/*jslint browser: true*/
/*jslint indent: 4 */
/*jslint todo: true */
/*global AC3D,THREE,Uint8Array,Worker*/
"use strict";

/**
 * Loader for CTM encoded models generated by OpenCTM tools:
 *     http://openctm.sourceforge.net/
 *
 * Uses js-openctm library by Juan Mellado
 *     http://code.google.com/p/js-openctm/
 *
 * @author alteredq / http://alteredqualia.com/
 */
/** @constructor */
AC3D.CTMLoader = function (showStatus) {
    THREE.Loader.call(this, showStatus);
    this.xhr = null;
};
AC3D.CTMLoader.prototype = Object.create(THREE.Loader.prototype);

//Load CTMLoader compressed models
//- parameters
//- url (required)
//- node (required)
AC3D.CTMLoader.prototype.load = function (url, node, parameters) {
    var xhr = new XMLHttpRequest();
    parameters = parameters || {};
    this.xhr = xhr;

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            /**
             * ALL OK
             */
            if (xhr.response && (xhr.status === 200 || xhr.status === 0)) {
                var binaryData, worker, files, fileTypes, fileNames, indexFile, currentImageID, indexImage;

                binaryData = new Uint8Array(xhr.response);
                worker = null;
                files = null;
                fileTypes = null;
                fileNames = null;
                indexFile = 0;

                /**
                 * Case 1: a worker is used
                 */
                if (parameters.useWorker) {
                    worker = parameters.binWorker || new Worker("resource/acute3d/libs/ctm/CTMWorker.js");
                    /** 
                     * Deal with error in worker
                     * - release worker
                     * - don't wait? delete data?
                     */
                    worker.onerror = function () {
                        AC3D.workerManager.returnWorker(this);
                        node.onLoadingError("worker");
                    };
                    worker.onmessage = function (event) {
                        files = event.data.files;
                        fileTypes = event.data.fileTypes;
                        fileNames = event.data.fileNames;
                        if (event.data.nodeData && files) {
                            node.updateSiblingsData(event.data.nodeData, files.length);
                            for (indexFile = 0; indexFile < files.length; indexFile += 1) {
                                if (fileTypes[indexFile] === 0) {
                                    AC3D.toProcessGeometries.push({"blob": files[indexFile], "name": fileNames[indexFile], "node": node});
                                } else {
                                    currentImageID = AC3D.imageID;
                                    AC3D.imageID += 1;
                                    for (indexImage = 0; indexImage < AC3D.toProcessImages.length; indexImage += 1) {
                                        if (AC3D.toProcessImages[indexImage] === null) {
                                            break;
                                        }
                                    }
                                    if (indexImage < AC3D.toProcessImages.length) {
                                        AC3D.toProcessImages[indexImage] = ({"blob": files[indexFile], "name": fileNames[indexFile], "node": node, "idImage": currentImageID, "status": "to load", "texture": null, "date": Date.now()});
                                        AC3D.freeImages -= 1;
                                    } else {
                                        AC3D.toProcessImages.push({"blob": files[indexFile], "name": fileNames[indexFile], "node": node, "idImage": currentImageID, "status": "to load", "texture": null, "date": Date.now()});
                                    }
                                }
                            }
                        }
                        AC3D.workerManager.returnWorker(this);
                    };
                    worker.postMessage({ "data": binaryData });
                } else {
                    /**
                     * Case 2: workers are not used --- should be disabled, not actual anymore
                     */

                    /** TO DO: should make sure of dealing with error. Otherwise do nothing, the application needs workers to work ok. */
                    node.onLoadingError();
                }
            } else {
                /**
                 * status is Ready, but Error
                 */
                //console.error("Couldn't load [" + url + "] [" + xhr.status + "]");
                /** Make sure to release the worker, if one is used*/
                if (parameters.useWorker && parameters.binWorker) {
                    AC3D.workerManager.returnWorker(parameters.binWorker);
                }
                node.onLoadingError();
            }
        }// END if xhr.readyState == 4
    };// end xhr.onreadystatechange function
    xhr.open("GET", url, true);
    xhr.responseType = "arraybuffer";
    xhr.send(null);
};


/*jslint browser: true*/
/*jslint indent: 4 */
/*jslint todo: true */
/*global AC3D,THREE*/
"use strict";
/** @constructor */
AC3D.JSONLoader = function (showStatus) {

    THREE.Loader.call(this, showStatus);

};

AC3D.JSONLoader.prototype = Object.create(THREE.Loader.prototype);

AC3D.JSONLoader.prototype.load = function (url, node, callback, callbackError) {
    var xhr, context;
    xhr = new XMLHttpRequest();
    context = this;

    xhr.onreadystatechange = function () {
        if (xhr.readyState === xhr.DONE) {
            if (xhr.status === 200 || xhr.status === 0) {
                if (xhr.responseText) {
                    var json, sameSRS;
                    json = JSON.parse(xhr.responseText);
                    sameSRS = context.parse(json, node);
                    if (callback) {
                        callback(sameSRS);
                    }
                } else {
                    if (callbackError) {
                        callbackError();
                    }
                }
            }
        }
    };
    xhr.onabort = function () {
        if (callbackError) {
            callbackError();
        }
    };

    xhr.onerror = function () {
        if (callbackError) {
            callbackError();
        }
    };
    xhr.open('GET', url, true);
    //xhr.withCredentials = this.withCredentials;
    try {
        xhr.send(null);
    } catch (err) {
        if (callbackError) {
            callbackError();
        }
    }
};

/**
 * define global value for the material, to avoid multiple copies
 */
var PROXY_MATERIAL = new THREE.MeshLambertMaterial({ ambient: 0xcccccc, side: THREE.DoubleSide });
AC3D.JSONLoader.prototype.parse = function (json, node) {
    var  offset, zLength, SRSOrigin, SRS, sameSRS, i, l;
    SRSOrigin = null;
    SRS = null;
    sameSRS = true;

    offset = 0;
    zLength = json.layers.length;
    while (offset < zLength) {
        if (json.layers[offset].type === "meshPyramid") {
            node.addURL(json.layers[offset].root);
            if (json.layers[offset].SRS) {
                node.setSRS(json.layers[offset].SRS);
                if (!SRS) {
                    SRS = json.layers[offset].SRS;
                } else if (SRS !== json.layers[offset].SRS) {
                    sameSRS = false;
                }
            }
            if (json.layers[offset].SRSOrigin) {
                node.setSRSOrigin(json.layers[offset].SRSOrigin);
                if (!SRSOrigin) {
                    SRSOrigin = json.layers[offset].SRSOrigin;
                } else {
                    if (SRSOrigin.length !== json.layers[offset].SRSOrigin.length) {
                        sameSRS = false;
                    } else {
                        for (i = 0, l = SRSOrigin.length; i < l; i += 1) {
                            if (SRSOrigin[i] !== json.layers[offset].SRSOrigin[i]) {
                                sameSRS = false;
                            }
                        }
                    }
                }
            }
        }
        offset += 1;
    }
    if (json.name) {
        node.setSceneName(json.name);
    }
    if (json.description) {
        node.setSceneDescription(json.description);
    }
    if (json.sceneOptions) {
        offset = 0;
        zLength = json.sceneOptions.length;
        while (offset < zLength) {
            if (json.sceneOptions[offset].navigationMode) {
                node.setNavigationMode(json.sceneOptions[offset].navigationMode);
            }
            offset += 1;
        }
    }
    if (json.logo) {
        node.setLogo(json.logo);
    }
    return sameSRS;
};

var LZMA = LZMA || {};

LZMA.OutWindow = function(){
  this._windowSize = 0;
};

LZMA.OutWindow.prototype.create = function(windowSize){
  if ( (!this._buffer) || (this._windowSize !== windowSize) ){
    this._buffer = [];
  }
  this._windowSize = windowSize;
  this._pos = 0;
  this._streamPos = 0;
};

LZMA.OutWindow.prototype.flush = function(){
  var size = this._pos - this._streamPos;
  if (size !== 0){
    while(size --){
      this._stream.writeByte(this._buffer[this._streamPos ++]);
    }
    if (this._pos >= this._windowSize){
      this._pos = 0;
    }
    this._streamPos = this._pos;
  }
};

LZMA.OutWindow.prototype.releaseStream = function(){
  this.flush();
  this._stream = null;
};

LZMA.OutWindow.prototype.setStream = function(stream){
  this.releaseStream();
  this._stream = stream;
};

LZMA.OutWindow.prototype.init = function(solid){
  if (!solid){
    this._streamPos = 0;
    this._pos = 0;
  }
};

LZMA.OutWindow.prototype.copyBlock = function(distance, len){
  var pos = this._pos - distance - 1;
  if (pos < 0){
    pos += this._windowSize;
  }
  while(len --){
    if (pos >= this._windowSize){
      pos = 0;
    }
    this._buffer[this._pos ++] = this._buffer[pos ++];
    if (this._pos >= this._windowSize){
      this.flush();
    }
  }
};

LZMA.OutWindow.prototype.putByte = function(b){
  this._buffer[this._pos ++] = b;
  if (this._pos >= this._windowSize){
    this.flush();
  }
};

LZMA.OutWindow.prototype.getByte = function(distance){
  var pos = this._pos - distance - 1;
  if (pos < 0){
    pos += this._windowSize;
  }
  return this._buffer[pos];
};

LZMA.RangeDecoder = function(){
};

LZMA.RangeDecoder.prototype.setStream = function(stream){
  this._stream = stream;
};

LZMA.RangeDecoder.prototype.releaseStream = function(){
  this._stream = null;
};

LZMA.RangeDecoder.prototype.init = function(){
  var i = 5;

  this._code = 0;
  this._range = -1;
  
  while(i --){
    this._code = (this._code << 8) | this._stream.readByte();
  }
};

LZMA.RangeDecoder.prototype.decodeDirectBits = function(numTotalBits){
  var result = 0, i = numTotalBits, t;

  while(i --){
    this._range >>>= 1;
    t = (this._code - this._range) >>> 31;
    this._code -= this._range & (t - 1);
    result = (result << 1) | (1 - t);

    if ( (this._range & 0xff000000) === 0){
      this._code = (this._code << 8) | this._stream.readByte();
      this._range <<= 8;
    }
  }

  return result;
};

LZMA.RangeDecoder.prototype.decodeBit = function(probs, index){
  var prob = probs[index],
      newBound = (this._range >>> 11) * prob;

  if ( (this._code ^ 0x80000000) < (newBound ^ 0x80000000) ){
    this._range = newBound;
    probs[index] += (2048 - prob) >>> 5;
    if ( (this._range & 0xff000000) === 0){
      this._code = (this._code << 8) | this._stream.readByte();
      this._range <<= 8;
    }
    return 0;
  }

  this._range -= newBound;
  this._code -= newBound;
  probs[index] -= prob >>> 5;
  if ( (this._range & 0xff000000) === 0){
    this._code = (this._code << 8) | this._stream.readByte();
    this._range <<= 8;
  }
  return 1;
};

LZMA.initBitModels = function(probs, len){
  while(len --){
    probs[len] = 1024;
  }
};

LZMA.BitTreeDecoder = function(numBitLevels){
  this._models = [];
  this._numBitLevels = numBitLevels;
};

LZMA.BitTreeDecoder.prototype.init = function(){
  LZMA.initBitModels(this._models, 1 << this._numBitLevels);
};

LZMA.BitTreeDecoder.prototype.decode = function(rangeDecoder){
  var m = 1, i = this._numBitLevels;

  while(i --){
    m = (m << 1) | rangeDecoder.decodeBit(this._models, m);
  }
  return m - (1 << this._numBitLevels);
};

LZMA.BitTreeDecoder.prototype.reverseDecode = function(rangeDecoder){
  var m = 1, symbol = 0, i = 0, bit;

  for (; i < this._numBitLevels; ++ i){
    bit = rangeDecoder.decodeBit(this._models, m);
    m = (m << 1) | bit;
    symbol |= bit << i;
  }
  return symbol;
};

LZMA.reverseDecode2 = function(models, startIndex, rangeDecoder, numBitLevels){
  var m = 1, symbol = 0, i = 0, bit;

  for (; i < numBitLevels; ++ i){
    bit = rangeDecoder.decodeBit(models, startIndex + m);
    m = (m << 1) | bit;
    symbol |= bit << i;
  }
  return symbol;
};

LZMA.LenDecoder = function(){
  this._choice = [];
  this._lowCoder = [];
  this._midCoder = [];
  this._highCoder = new LZMA.BitTreeDecoder(8);
  this._numPosStates = 0;
};

LZMA.LenDecoder.prototype.create = function(numPosStates){
  for (; this._numPosStates < numPosStates; ++ this._numPosStates){
    this._lowCoder[this._numPosStates] = new LZMA.BitTreeDecoder(3);
    this._midCoder[this._numPosStates] = new LZMA.BitTreeDecoder(3);
  }
};

LZMA.LenDecoder.prototype.init = function(){
  var i = this._numPosStates;
  LZMA.initBitModels(this._choice, 2);
  while(i --){
    this._lowCoder[i].init();
    this._midCoder[i].init();
  }
  this._highCoder.init();
};

LZMA.LenDecoder.prototype.decode = function(rangeDecoder, posState){
  if (rangeDecoder.decodeBit(this._choice, 0) === 0){
    return this._lowCoder[posState].decode(rangeDecoder);
  }
  if (rangeDecoder.decodeBit(this._choice, 1) === 0){
    return 8 + this._midCoder[posState].decode(rangeDecoder);
  }
  return 16 + this._highCoder.decode(rangeDecoder);
};

LZMA.Decoder2 = function(){
  this._decoders = [];
};

LZMA.Decoder2.prototype.init = function(){
  LZMA.initBitModels(this._decoders, 0x300);
};

LZMA.Decoder2.prototype.decodeNormal = function(rangeDecoder){
  var symbol = 1;

  do{
    symbol = (symbol << 1) | rangeDecoder.decodeBit(this._decoders, symbol);
  }while(symbol < 0x100);

  return symbol & 0xff;
};

LZMA.Decoder2.prototype.decodeWithMatchByte = function(rangeDecoder, matchByte){
  var symbol = 1, matchBit, bit;

  do{
    matchBit = (matchByte >> 7) & 1;
    matchByte <<= 1;
    bit = rangeDecoder.decodeBit(this._decoders, ( (1 + matchBit) << 8) + symbol);
    symbol = (symbol << 1) | bit;
    if (matchBit !== bit){
      while(symbol < 0x100){
        symbol = (symbol << 1) | rangeDecoder.decodeBit(this._decoders, symbol);
      }
      break;
    }
  }while(symbol < 0x100);

  return symbol & 0xff;
};

LZMA.LiteralDecoder = function(){
};

LZMA.LiteralDecoder.prototype.create = function(numPosBits, numPrevBits){
  var i;

  if (this._coders
    && (this._numPrevBits === numPrevBits)
    && (this._numPosBits === numPosBits) ){
    return;
  }
  this._numPosBits = numPosBits;
  this._posMask = (1 << numPosBits) - 1;
  this._numPrevBits = numPrevBits;

  this._coders = [];

  i = 1 << (this._numPrevBits + this._numPosBits);
  while(i --){
    this._coders[i] = new LZMA.Decoder2();
  }
};

LZMA.LiteralDecoder.prototype.init = function(){
  var i = 1 << (this._numPrevBits + this._numPosBits);
  while(i --){
    this._coders[i].init();
  }
};

LZMA.LiteralDecoder.prototype.getDecoder = function(pos, prevByte){
  return this._coders[( (pos & this._posMask) << this._numPrevBits)
    + ( (prevByte & 0xff) >>> (8 - this._numPrevBits) )];
};

LZMA.Decoder = function(){
  this._outWindow = new LZMA.OutWindow();
  this._rangeDecoder = new LZMA.RangeDecoder();
  this._isMatchDecoders = [];
  this._isRepDecoders = [];
  this._isRepG0Decoders = [];
  this._isRepG1Decoders = [];
  this._isRepG2Decoders = [];
  this._isRep0LongDecoders = [];
  this._posSlotDecoder = [];
  this._posDecoders = [];
  this._posAlignDecoder = new LZMA.BitTreeDecoder(4);
  this._lenDecoder = new LZMA.LenDecoder();
  this._repLenDecoder = new LZMA.LenDecoder();
  this._literalDecoder = new LZMA.LiteralDecoder();
  this._dictionarySize = -1;
  this._dictionarySizeCheck = -1;

  this._posSlotDecoder[0] = new LZMA.BitTreeDecoder(6);
  this._posSlotDecoder[1] = new LZMA.BitTreeDecoder(6);
  this._posSlotDecoder[2] = new LZMA.BitTreeDecoder(6);
  this._posSlotDecoder[3] = new LZMA.BitTreeDecoder(6);
};

LZMA.Decoder.prototype.setDictionarySize = function(dictionarySize){
  if (dictionarySize < 0){
    return false;
  }
  if (this._dictionarySize !== dictionarySize){
    this._dictionarySize = dictionarySize;
    this._dictionarySizeCheck = Math.max(this._dictionarySize, 1);
    this._outWindow.create( Math.max(this._dictionarySizeCheck, 4096) );
  }
  return true;
};

LZMA.Decoder.prototype.setLcLpPb = function(lc, lp, pb){
  var numPosStates = 1 << pb;

  if (lc > 8 || lp > 4 || pb > 4){
    return false;
  }

  this._literalDecoder.create(lp, lc);

  this._lenDecoder.create(numPosStates);
  this._repLenDecoder.create(numPosStates);
  this._posStateMask = numPosStates - 1;

  return true;
};

LZMA.Decoder.prototype.init = function(){
  var i = 4;

  this._outWindow.init(false);

  LZMA.initBitModels(this._isMatchDecoders, 192);
  LZMA.initBitModels(this._isRep0LongDecoders, 192);
  LZMA.initBitModels(this._isRepDecoders, 12);
  LZMA.initBitModels(this._isRepG0Decoders, 12);
  LZMA.initBitModels(this._isRepG1Decoders, 12);
  LZMA.initBitModels(this._isRepG2Decoders, 12);
  LZMA.initBitModels(this._posDecoders, 114);

  this._literalDecoder.init();

  while(i --){
    this._posSlotDecoder[i].init();
  }

  this._lenDecoder.init();
  this._repLenDecoder.init();
  this._posAlignDecoder.init();
  this._rangeDecoder.init();
};

LZMA.Decoder.prototype.decode = function(inStream, outStream, outSize){
  var state = 0, rep0 = 0, rep1 = 0, rep2 = 0, rep3 = 0, nowPos64 = 0, prevByte = 0,
      posState, decoder2, len, distance, posSlot, numDirectBits;

  this._rangeDecoder.setStream(inStream);
  this._outWindow.setStream(outStream);

  this.init();

  while(outSize < 0 || nowPos64 < outSize){
    posState = nowPos64 & this._posStateMask;

    if (this._rangeDecoder.decodeBit(this._isMatchDecoders, (state << 4) + posState) === 0){
      decoder2 = this._literalDecoder.getDecoder(nowPos64 ++, prevByte);

      if (state >= 7){
        prevByte = decoder2.decodeWithMatchByte(this._rangeDecoder, this._outWindow.getByte(rep0) );
      }else{
        prevByte = decoder2.decodeNormal(this._rangeDecoder);
      }
      this._outWindow.putByte(prevByte);

      state = state < 4? 0: state - (state < 10? 3: 6);

    }else{

      if (this._rangeDecoder.decodeBit(this._isRepDecoders, state) === 1){
        len = 0;
        if (this._rangeDecoder.decodeBit(this._isRepG0Decoders, state) === 0){
          if (this._rangeDecoder.decodeBit(this._isRep0LongDecoders, (state << 4) + posState) === 0){
            state = state < 7? 9: 11;
            len = 1;
          }
        }else{
          if (this._rangeDecoder.decodeBit(this._isRepG1Decoders, state) === 0){
            distance = rep1;
          }else{
            if (this._rangeDecoder.decodeBit(this._isRepG2Decoders, state) === 0){
              distance = rep2;
            }else{
              distance = rep3;
              rep3 = rep2;
            }
            rep2 = rep1;
          }
          rep1 = rep0;
          rep0 = distance;
        }
        if (len === 0){
          len = 2 + this._repLenDecoder.decode(this._rangeDecoder, posState);
          state = state < 7? 8: 11;
        }
      }else{
        rep3 = rep2;
        rep2 = rep1;
        rep1 = rep0;

        len = 2 + this._lenDecoder.decode(this._rangeDecoder, posState);
        state = state < 7? 7: 10;

        posSlot = this._posSlotDecoder[len <= 5? len - 2: 3].decode(this._rangeDecoder);
        if (posSlot >= 4){

          numDirectBits = (posSlot >> 1) - 1;
          rep0 = (2 | (posSlot & 1) ) << numDirectBits;

          if (posSlot < 14){
            rep0 += LZMA.reverseDecode2(this._posDecoders,
                rep0 - posSlot - 1, this._rangeDecoder, numDirectBits);
          }else{
            rep0 += this._rangeDecoder.decodeDirectBits(numDirectBits - 4) << 4;
            rep0 += this._posAlignDecoder.reverseDecode(this._rangeDecoder);
            if (rep0 < 0){
              if (rep0 === -1){
                break;
              }
              return false;
            }
          }
        }else{
          rep0 = posSlot;
        }
      }

      if (rep0 >= nowPos64 || rep0 >= this._dictionarySizeCheck){
        return false;
      }

      this._outWindow.copyBlock(rep0, len);
      nowPos64 += len;
      prevByte = this._outWindow.getByte(0);
    }
  }

  this._outWindow.flush();
  this._outWindow.releaseStream();
  this._rangeDecoder.releaseStream();

  return true;
};

LZMA.Decoder.prototype.setDecoderProperties = function(properties){
  var value, lc, lp, pb, dictionarySize;

  if (properties.size < 5){
    return false;
  }

  value = properties.readByte();
  lc = value % 9;
  value = ~~(value / 9);
  lp = value % 5;
  pb = ~~(value / 5);

  if ( !this.setLcLpPb(lc, lp, pb) ){
    return false;
  }

  dictionarySize = properties.readByte();
  dictionarySize |= properties.readByte() << 8;
  dictionarySize |= properties.readByte() << 16;
  dictionarySize += properties.readByte() * 16777216;

  return this.setDictionarySize(dictionarySize);
};

LZMA.decompress = function(properties, inStream, outStream, outSize){
  var decoder = new LZMA.Decoder();

  if ( !decoder.setDecoderProperties(properties) ){
    throw "Incorrect stream properties";
  }

  if ( !decoder.decode(inStream, outStream, outSize) ){
    throw "Error in data stream";
  }

  return true;
};

/*jslint browser: true*/
/*jslint indent: 4 */
/*jslint todo: true */
/*global AC3D,THREE*/
"use strict";

var descSort = function (a, b) {
    return a.distance - b.distance;
};

/**
 * Global variables: managers
 */

AC3D.workerManager = new AC3D.WorkerManager();
AC3D.ctmLoaderManager = new AC3D.CTMLoaderManager();

/** @constructor */
AC3D.Ac3dROOT = function (url, serverPath, ui) {
    THREE.Group.call(this);
    this.ui = ui;
    this.url = url;
    this.serverPath = serverPath;
    //TO DO: detect if the worker can be used
    this.useWorker = true;
    this.expiryTime = 20000; //20s, in milliseconds
    this.maxDelayRemoveExpired = this.expiryTime * 6; //even if the texture is not consumed, force remove after this delay
    this.frameTimestamp = Date.now();
    this.lastRemoveExpired = Date.now() + 200;
    this.textureUsed = 0;
    /** Do not forget to call updateMaxTexture upon init and when canvas is resized */
    this.maxTexture = 0;

    this.childrenLOD = new THREE.Group();
    this.add(this.childrenLOD);

    /** Variables used for updating the LODTree in "parts"*/
    this.STATE = { NONE: -1, PROCESS_DOWNLOADS: 0, UPDATING: 1, LAUNCH_DOWNLOADS: 2, REMOVE_READY: 3, REMOVING: 4 };
    this.currentState = this.STATE.NONE;
    this.currentIndex = 0;
    this.uploadStep = 1;
    this.maxRepeatDownloads = 10;
    this.currentRepeatDownloads = 0;
    this.matrixAutoUpdate = false;
    this.orderByPixelRadius = true;

    this.name = "";
    this.description = "";
    this.navigationMode = "";
    this.logo = "";

    this.SRS = "";
    this.SRSOrigin = [0, 0, 0];

    this.debugVerbose = false;

    this.numberChildrenLoaded = 0;
    this.sceneIsLoaded = false;
    this.loaderROOT = null;
    this.downloadQueue = [];

    this.bbox = new THREE.Box3();
    this.pixelRatio = 1;
    /*
    var img = document.createElement("img");
    img.src = "grid.jpg";
    img.onload = (function (self) {
        return function () {
            AC3D.material_noTexture.map = AC3D.textureManager.getTexture();
            AC3D.material_noTexture.generateMipmaps = true;
            AC3D.material_noTexture.map.image = self;
            AC3D.material_noTexture.map.needsUpdate = true;
        };
    }(img));
     */
    //AC3D.material_noTexture.ambient.setRGB(0, 1, 0); //used to set the color for untextured data
};

AC3D.Ac3dROOT.prototype = Object.create(THREE.Group.prototype);

AC3D.Ac3dROOT.prototype.updateMaxTexture = function (screenWidth, screenHeight, isDesktop) {
    var sW, sH;
    //sW = Math.pow(2, Math.ceil(Math.log(screenWidth) / Math.log(2)));//the nearest bigger power of 2
    //sH = Math.pow(2, Math.ceil(Math.log(screenHeight) / Math.log(2)));
    /**
     * Size not always representative of memory. Typically, iPad has the same memory as an iPhone, but twice the length/width
     * Consider maybe the maximum safe size as 500MB for mobile and 1GB for desktop. 
     * - Don't forget that the geometry size is not counted! Should I count?
     * - The texture size is without a multiplication of 4 (the 4 bytes/pixel)
     * I'm not sure of how to deal with cases when the maximum size surpassed. 
     * We delete textures older than what? After we delete, how do we ensure a delay even if the texture is surpassed?
     * Maybe half the expiration time, and half also the waiting time as long as the memory is higher that allowed (boolean when it passes lower) 
     */
    sW = screenWidth;
    sH = screenHeight;
    this.maxTexture = 32 * sW * sH;
    //isDesktop undefined has the same effect as isDesktop = false
    if (!isDesktop && Math.max(sW, sH) <= 1024) {
        this.pixelRatio = 1.5;
    } else {
        this.pixelRatio = 1.0;
    }
};

AC3D.Ac3dROOT.prototype.increaseUsedTexture = function (texWidth, texHeight) {
    this.textureUsed += texWidth * texHeight;
    //console.log("increaseUsedTexture = "+this.textureUsed);
};

AC3D.Ac3dROOT.prototype.decreaseUsedTexture = function (texWidth, texHeight) {
    this.textureUsed -= texWidth * texHeight;
    //console.log("decreaseUsedTexture = "+this.textureUsed);
};


AC3D.Ac3dROOT.prototype.load = function (callback, callbackError) {
    if (!this.loaderROOT) {
        this.loaderROOT = new AC3D.JSONLoader();
        this.loaderROOT.load(this.serverPath + this.url, this, callback, callbackError);
    }
    this.sceneIsLoaded = true;
    AC3D.workerManager.load();//make sure we have the set number of workers
};
AC3D.Ac3dROOT.prototype.unload = function () {
    while (this.downloadQueue.length > 0) {
        this.downloadQueue.pop();
    }
    /**
     * TO DO: 
     * - what happens with images/data that is loaded just after the unload?  
     */
    this.sceneIsLoaded = false;
    this.unloadAllChildren();
    AC3D.textureManager.unload();
    AC3D.materialManager.unload();
    AC3D.pagedLODManager.unload();
    AC3D.nodeManager.unload();
    AC3D.groupManager.unload();
    AC3D.ctmLoaderManager.unload();
    AC3D.workerManager.unload();//needs to be reloaded on load

    AC3D.toProcessImages = [];
    AC3D.toProcessGeometries = [];
    AC3D.imageID = 0;
    AC3D.freeImages = 0;
};

AC3D.Ac3dROOT.prototype.isSceneLoaded = function () {
    return this.sceneIsLoaded;
};

AC3D.Ac3dROOT.prototype.setDebugVerbose = function (debug) {
    this.debugVerbose = debug;
};

AC3D.Ac3dROOT.prototype.setSceneName = function (name) {
    this.name = name;
};

AC3D.Ac3dROOT.prototype.getSceneName = function () {
    return this.name;
};

AC3D.Ac3dROOT.prototype.setSceneDescription = function (description) {
    this.description = description;
};

AC3D.Ac3dROOT.prototype.getSceneDescription = function () {
    return this.description;
};

AC3D.Ac3dROOT.prototype.setNavigationMode = function (mode) {
    this.navigationMode = mode;
};

AC3D.Ac3dROOT.prototype.getNavigationMode = function () {
    return this.navigationMode;
};

AC3D.Ac3dROOT.prototype.setLogo = function (logo) {
    this.logo = logo;
};

AC3D.Ac3dROOT.prototype.getLogo = function () {
    return this.logo;
};

AC3D.Ac3dROOT.prototype.setSRS = function (SRS) {
    this.SRS = SRS;
};

AC3D.Ac3dROOT.prototype.getSRS = function () {
    return this.SRS;
};

AC3D.Ac3dROOT.prototype.setSRSOrigin = function (SRSOrigin) {
    this.SRSOrigin = SRSOrigin;
};

AC3D.Ac3dROOT.prototype.getSRSOrigin = function () {
    return this.SRSOrigin;
};

AC3D.Ac3dROOT.prototype.addURL = function (url) {
    var subfolder, urlNoPath;
    if (url.lastIndexOf("/") > -1) {
        subfolder = url.slice(0, url.lastIndexOf("/")) + "/";
        urlNoPath = url.slice(url.lastIndexOf("/") + 1);
    } else {
        subfolder = "";
        urlNoPath = url;
    }

    this.childrenLOD.add(AC3D.pagedLODManager.getPagedLOD(this, null, subfolder, urlNoPath, 0));

    //console.log("added url "+url);
};

AC3D.Ac3dROOT.prototype.onChildLoaded = function (i) {
    //console.log("onChildLoaded "+i);
    //if (i < 0 || i >= this.childrenProxy.children.length) {
    //    return;
    //}
    //this.childrenProxy.children[i].visible = false;

    /** Special setting to avoid seeing a transparent area. 
     * Because the geometry does not become visible before the next updateLODTree, the first tile has to be "forced" visible
     */
    this.childrenLOD.children[i].setVisible(true);
    this.numberChildrenLoaded += 1;
    if (this.numberChildrenLoaded === this.childrenLOD.children.length) {
        this.updateCameraPosition();
    }

};

AC3D.Ac3dROOT.prototype.updateLODTree = function (frustum, camera_matrixWorldInverse, camera_focal_length, height,
        maxDiameter, zNear) {
    /** Update download tables at each update call*/
    AC3D.updateDownloads();

    if (this.currentState === this.STATE.NONE) {
        this.currentIndex = 0;
        this.currentRepeatDownloads = 0;
        /** Process downloads at each update call*/
        AC3D.processDownloads();
        this.currentRepeatDownloads += 1;
        this.currentState = this.STATE.PROCESS_DOWNLOADS;
    } else if (this.currentState === this.STATE.PROCESS_DOWNLOADS) {
        if (this.currentRepeatDownloads < this.maxRepeatDownloads) {
            AC3D.processDownloads();
            this.currentRepeatDownloads += 1;
        }
        if (this.currentRepeatDownloads >= this.maxRepeatDownloads) {
            this.currentState = this.STATE.UPDATING;
        }
    } else if (this.currentState === this.STATE.UPDATING) {
        this.updateLODTree_part(frustum, camera_matrixWorldInverse, camera_focal_length, height, maxDiameter, zNear);
        this.updateCanvas();
    } else if (this.currentState === this.STATE.LAUNCH_DOWNLOADS) {
        this.launchDownloads();
    } else if (this.currentState === this.STATE.REMOVE_READY) {
        this.removeExpiredChildren(frustum, camera_matrixWorldInverse, camera_focal_length, height);
    }
};

AC3D.Ac3dROOT.prototype.intersectLODTree = function (raycaster) {
    var intersects, i;
    intersects = [];
    for (i = 0; i < this.childrenLOD.children.length; i += 1) {
        this.childrenLOD.children[i].intersectPagedLOD(raycaster, intersects);
    }
    intersects.sort(descSort);
    return intersects;
};

/** Separate  the updating of the LODTree in parts. Each part is called with a timeout, so any draw call waiting has a chance to be processed.
 * Note: this means that the LODTree is not updated before every draw, and potentially higher resolution data is drawn when the lower resolution should be drawn*/
AC3D.Ac3dROOT.prototype.updateLODTree_part = function (frustum, camera_matrixWorldInverse, camera_focal_length, height, maxDiameter, zNear) {
    var endIndex, i;

    endIndex = Math.min(this.childrenLOD.children.length, this.currentIndex + this.uploadStep);

    for (i = this.currentIndex; i < endIndex; i += 1) {
        this.childrenLOD.children[i].visible = true;
        if (this.childrenLOD.children[i].loadedRequested === false) {
            /**TO DO: make sure the loaded tag is true even when error, so as not to keep loading. Maybe a tag isBeingLoaded?*/
            this.childrenLOD.children[i].loadLOD(i);
        } else {
            /**traverse all tiles in accordance to the previously defined order*/
            this.childrenLOD.children[i].updatePagedLODTree(frustum, camera_matrixWorldInverse, camera_focal_length, height, maxDiameter, zNear);
        }
    }

    if (endIndex === this.childrenLOD.children.length) {
        this.currentState = this.STATE.LAUNCH_DOWNLOADS;
    } else {
        this.currentIndex = this.currentIndex + this.uploadStep;
    }
};
/**
 * 
 */
AC3D.Ac3dROOT.prototype.addToDownloadQueue = function (pagedLOD, distance, level, idSibling) {
    this.downloadQueue.push({"node": pagedLOD, "distance": distance, "level": level, "idSibling": idSibling });
};
/**
 * 
 */
AC3D.Ac3dROOT.prototype.launchDownloads = function () {
    var loadLaunched, currentNode;
    loadLaunched = true;

    //distance is the distance between size on screen and desired screen, so the bigger the distance, the more important
    if (this.downloadQueue.length !== 0) {
        this.downloadQueue.sort(function (a, b) {
            if (a.distance < b.distance) {
                return 1;
            }
            if (a.distance > b.distance) {
                return -1;
            }
            // prefer lower level if distance is equal
            if (a.level > b.level) {
                return 1;
            }
            if (a.level < b.level) {
                return -1;
            }
            return 0;
        });
        while (this.downloadQueue.length !== 0) {
            currentNode = this.downloadQueue.shift(); //get the front element
            /*if (this.debugVerbose === true) {
                if (loadLaunched) {
                    console.log("--   Launching = " + currentNode.node.url + " children of sibling" + currentNode.idSibling +
                            " with distance " + currentNode.distance + ": level " + currentNode.level);
                } else {
                    console.log("-- not Launching = " + currentNode.node.url + " children of sibling" + currentNode.idSibling +
                            " with distance " + currentNode.distance + ": level " + currentNode.level);
                }
            }*/
            if (loadLaunched) {
                loadLaunched = currentNode.node.loadSiblingChildren(currentNode.idSibling);
            }
        }
        /*if (this.debugVerbose === true) {
            console.log("---------------");
        }*/
    }
    this.currentState = this.STATE.REMOVE_READY;
};
/**
 * 
 * @param showWireframe
 */
AC3D.Ac3dROOT.prototype.setWireframe = function (showWireframe) {
    AC3D.showWireframe = showWireframe;
};

/**
 * Use sparingly
 */
AC3D.Ac3dROOT.prototype.updateCanvas = function () {
    this.ui.updateCanvas();
};

AC3D.Ac3dROOT.prototype.updateCameraPosition = function () {
    this.ui.updateCameraPosition();
};

AC3D.Ac3dROOT.prototype.getBBox = function () {
    //compute scene BBox
    var i, l;
    this.bbox.makeEmpty();
    for (i = 0, l = this.childrenLOD.children.length; i < l; i += 1) {
        if (this.childrenLOD.children[i] instanceof AC3D.PagedLOD) {
            this.bbox.union(this.childrenLOD.children[i].getBBoxFromSiblings());
        }
    }
    return this.bbox;
};

AC3D.Ac3dROOT.prototype.unloadAllChildren = function () {
    var i, l;
    for (i = 0, l = this.childrenLOD.children.length; i < l; i += 1) {
        this.childrenLOD.children[i].unload();
    }
};

AC3D.Ac3dROOT.prototype.removeExpiredChildren = function (frustum, camera_matrixWorldInverse, camera_focal_length, height) {
    if (this.currentState !== this.STATE.NONE && this.currentState !== this.STATE.REMOVE_READY) {
        return;
    }

    var i, l, time;
    //console.log("remove test ");
    this.frameTimestamp = Date.now();
    /** Avoid calling remove before any remove can be done, because the time between calls is too small */
    /*  if (((this.textureUsed > this.maxTexture) && (this.frameTimestamp - this.lastRemoveExpired > 1.2 * this.expiryTime)) ||
            (this.frameTimestamp - this.lastRemoveExpired > this.maxDelayRemoveExpired)) {*/
    if ((this.frameTimestamp - this.lastRemoveExpired) > 1.2 * this.expiryTime) {
        this.lastRemoveExpired = this.frameTimestamp + 200;
        /** Geometries number is increased in createMeshBuffers. This function increases the geometries of the parent!, not the scene. Decreasing decreases the geometries of the scene*/
        //console.log("before: textures = "+ renderer.info.memory.textures+"; geometries = "+ renderer.info.memory.geometries);
        for (i = 0, l = this.childrenLOD.children.length; i < l; i += 1) {
            this.childrenLOD.children[i].removeExpiredChildren(frustum, camera_matrixWorldInverse, camera_focal_length, height);
            /*if (!this.childrenLOD.children[i].loaded) {
                //this.childrenProxy.children[i].visible = true;
            }*/
        }

        time = Date.now() - this.frameTimestamp;
        if (this.debugVerbose === true) {
            console.log("Expired Children = " + time + "ms");
        }
        //console.log("after: textures = "+ renderer.info.memory.textures+"; geometries = "+ renderer.info.memory.geometries);
    }

    this.currentState = this.STATE.NONE;
    // this.updateCanvas();
    //
};
/*jslint browser: true*/
/*jslint indent: 4 */
/*jslint todo: true */
/*global AC3D,THREE*/
"use strict";

/** @constructor */
AC3D.PagedLOD = function (root, LODParent, subfolder, url, level) {
    THREE.Group.call(this);
    /**
     * Data about Siblings
     */
    this.siblings = [];
    this.siblingChildren = [];
    this.siblingVisibleByFrustum = [];

    this.materialsUsed = [];
    this.siblingsOrder = [];
    this.waitAfterError = 10000;//time in milliseconds
    this.matrixAutoUpdate = false;

    this.init(root, LODParent, subfolder, url, level);
};

AC3D.PagedLOD.prototype = Object.create(THREE.Group.prototype);

AC3D.PagedLOD.prototype.init = function (root, LODParent, subfolder, url, level) {
    this.level = level;

    this.url = url;
    this.subfolder = subfolder.replace(/\+/g, "%2B"); /** TO DO: fix! This is for Amazon S3, that does not like + signs*/
    this.root = root;
    this.url = this.url.replace(/\+/g, "%2B"); /** TO DO: fix! This is for Amazon S3, that does not like + signs*/
    this.url = this.url.replace("_start", ""); /** TO DO: fix! This skips the _start nodes*/

    this.LODParent = LODParent;
    this.loaded = false;
    this.loadedRequested = false;

    this.numberOfFilesToLoad = 0;
    this.numberOfFilesLoaded = 0;
    this.loadingError = false;
    this.lastError = 0;

    this.parentIDInSiblinghood = null;

    this.loaderCTM = null;
};


AC3D.PagedLOD.prototype.updateSiblingsData = function (nodeData, numberOfFilesToLoad) {
    this.clearSiblingsArrays();
    var idNode, idChild, newSibling, newSiblingChildren, child, childSubfolder, childUrl, indexOfFolder, squaredX, squaredY, squaredZ;
    /** Create nodes from parsed JSON (the parsing is done in the Worker)*/
    /*comment = {"size":[26236,14854,6811,180,180,180,181],
     *  "name":["Texture_0.jpg","Texture_1.jpg","Texture_2.jpg","Geometry_0.ctm","Geometry_1.ctm","Geometry_2.ctm","Geometry_3.ctm"],
     *  "node":[{"name":"Node_0", "center": [250,250,10],"radius":353.553,"range": [[0,128],[128,1e+30]],"children": ["Tile_000.bin"]},
     *       {"name":"Node_1", "center": [750,250,10],"radius":353.553,"range": [[0,128],[128,1e+30]],"children": ["Tile_001.bin"]},
     *       {"name":"Node_2", "center": [500,750,10],"radius":559.017,"range": [[0,256],[256,1e+30]],"children": ["Tile_002.bin","Tile_003.bin"]}
     *                 ]
     *          } 
     */
    for (idNode = 0; idNode < nodeData.length; idNode += 1) {
        newSibling = AC3D.nodeManager.getNode(nodeData[idNode].id); //new AC3D.Node(nodeData[idNode].name);
        newSiblingChildren =  AC3D.groupManager.getGroup();//new THREE.Group();
        newSiblingChildren.name = nodeData[idNode].id; //the children group and the node have the same name: the name should be unique among the siblings.

        if (nodeData[idNode].center) {
            newSibling.sphereCenter.x = parseFloat(nodeData[idNode].center[0]);
            newSibling.sphereCenter.y = parseFloat(nodeData[idNode].center[1]);
            newSibling.sphereCenter.z = parseFloat(nodeData[idNode].center[2]);
        } else if (nodeData[idNode].bbMin && nodeData[idNode].bbMax) {
            newSibling.sphereCenter.x = 0.5 * (parseFloat(nodeData[idNode].bbMin[0]) + parseFloat(nodeData[idNode].bbMax[0]));
            newSibling.sphereCenter.y = 0.5 * (parseFloat(nodeData[idNode].bbMin[1]) + parseFloat(nodeData[idNode].bbMax[1]));
            newSibling.sphereCenter.z = 0.5 * (parseFloat(nodeData[idNode].bbMin[2]) + parseFloat(nodeData[idNode].bbMax[2]));
        } else {
            newSibling.sphereCenter.x = 0;
            newSibling.sphereCenter.y = 0;
            newSibling.sphereCenter.z = 0;
        }

        if (nodeData[idNode].radius) {
            newSibling.sphereRadius = parseFloat(nodeData[idNode].radius);
        } else if (nodeData[idNode].bbMin && nodeData[idNode].bbMax) {
            squaredX = (parseFloat(nodeData[idNode].bbMax[0]) - parseFloat(nodeData[idNode].bbMin[0]));
            squaredX = squaredX * squaredX;
            squaredY = (parseFloat(nodeData[idNode].bbMax[1]) - parseFloat(nodeData[idNode].bbMin[1]));
            squaredY = squaredY * squaredY;
            squaredZ = (parseFloat(nodeData[idNode].bbMax[2]) - parseFloat(nodeData[idNode].bbMin[2]));
            squaredZ = squaredZ * squaredZ;

            newSibling.sphereRadius = 0.5 * Math.sqrt(squaredX + squaredY + squaredZ);
        } else {
            newSibling.sphereRadius = 0;
        }

        //newSibling.setNodeBoundingSphereFromNodeData();//using newSibling.sphereRadius and newSibling.sphereCenter

        if (nodeData[idNode].maxScreenDiameter) {
            newSibling.maxLODRange =  parseFloat(nodeData[idNode].maxScreenDiameter);
            newSibling.minLODRange = 0;
        }

        if (nodeData[idNode].children) {
            for (idChild = 0; idChild < nodeData[idNode].children.length; idChild += 1) {
                indexOfFolder = nodeData[idNode].children[idChild].lastIndexOf("/");
                /** TO DO: consider http:// paths*/
                if (indexOfFolder > -1) {
                    childSubfolder = this.subfolder + nodeData[idNode].children[idChild].slice(0, indexOfFolder) + "/";
                    childUrl = nodeData[idNode].children[idChild].slice(indexOfFolder + 1);
                } else {
                    childSubfolder = this.subfolder;
                    childUrl = nodeData[idNode].children[idChild];
                }

                /** TO DO: make sure that we delete the reference to the LODParent when clearing the node. Otherwise the nodes risk not being deleted*/
                child = AC3D.pagedLODManager.getPagedLOD(this.root, newSibling, childSubfolder, childUrl, this.level + 1);
                newSiblingChildren.add(child);
            }
        }
        //Add a sibling data to the PagedLOD
        newSibling.setVisible(false);
        //newSiblingChildren.visible = false;

        this.siblings.push(newSibling);
        this.add(newSibling);
        this.siblingChildren.push(newSiblingChildren);
        /** Sibling Children need to be added as children of PageLOD, otherwise the THREE tree is broken, the children are not updated & rendered*/
        this.add(newSiblingChildren);
        /** Siblings are reordered by distance to center/camera each frame. 
         * The computed order is kept in the siblingsOrder array, which has to have the same length as the siblings array. 
         */
        //Should already by defined
        if (this.siblingsOrder === undefined || this.siblingsOrder === null) {
            this.siblingsOrder = [];
        }
        this.siblingsOrder.push([this.siblings.length - 1, Infinity]);
        this.siblingVisibleByFrustum.push(false);
    }

    this.numberOfFilesToLoad = numberOfFilesToLoad;
    this.numberOfFilesLoaded = 0;
    //if node is empty
    if (this.numberOfFilesLoaded >= this.numberOfFilesToLoad) {
        this.loadingFinished();
    }
};

/**
 * error occurred while loading the PagedLOD set of siblings; set error flag to true. 
 * Only clear the node if loading finished. Note: some data might be waiting for processing, should not release the node data i this case.
 */
AC3D.PagedLOD.prototype.onLoadingError = function (placeOfError) {
    this.loadingError = true;
    //if the error occurred prior to data being processed, it is save to release loader   
    if (placeOfError === undefined || placeOfError === "worker") {
        this.loadingFinished();
    } else {
        this.numberOfFilesLoaded += 1;
        //TO DO: fix this.numberOfFilesLoaded can be greater than this.numberOfFilesToLoad
        //I believe I fixed it: addTexture was incrementing the numberOfFilesLoaded twice
        if (this.numberOfFilesLoaded >= this.numberOfFilesToLoad) {
            this.loadingFinished();
        }
    }
};

/**
 * error on loading the node AND loading finished: 
 * TO DO: make sure the node is reset (delete already loaded data)
 */
AC3D.PagedLOD.prototype.errorLoadedNode = function () {
    if (this.loaderCTM) {
        AC3D.ctmLoaderManager.returnLoader(this.loaderCTM);
        this.loaderCTM = null;
    }
    this.lastError = Date.now();
};

/** After a loading error, the node is blocked from requesting a new load for a time, indicated by "waitAfterError".
 * Blocking means the flag  loaded = false AND loadedRequested = true;
 * Once the blocking time is passed, the node is released for loading*/
AC3D.PagedLOD.prototype.unblockNodeForLoading = function () {
    this.loaded = false;
    this.loadedRequested = false;
    this.loadingError = false;
    this.lastError = 0;
};

AC3D.PagedLOD.prototype.loadingFinished = function () {
    if (this.loadingError) {
        this.errorLoadedNode();
    } else {
        if (this.loaderCTM) {
            AC3D.ctmLoaderManager.returnLoader(this.loaderCTM);
            this.loaderCTM = null;
        }
        this.loaded = true;
        //If first level after root, call the root function
        if (this.LODParent === null) {
            if (this.root && this.parentIDInSiblinghood !== null && this.parentIDInSiblinghood !== undefined) {
                this.root.onChildLoaded(this.parentIDInSiblinghood);
            }
        } else {
            //LODParent is actually a sibling (type Node, not PagedLOD)
            this.LODParent.numberChildrenLoaded += 1;
            if (this.root) {
                this.root.updateCanvas();
            }
        }
    }
};

AC3D.PagedLOD.prototype.setVisible = function (visibility) {
    var idSibling;
    for (idSibling = 0;  idSibling < this.siblings.length; idSibling += 1) {
        if (visibility === false) {
            if (this.siblings[idSibling].visible) {
                this.siblings[idSibling].lastSeen = Date.now();
            }
            this.siblings[idSibling].ancestorVisible = this.LODParent.ancestorVisible;
        }
        this.siblings[idSibling].setVisible(visibility);
    }
};

AC3D.PagedLOD.prototype.addTexture  = function (texture) {
    //var material = new THREE.MeshLambertMaterial({ ambient: 0xffffff, map: texture, reflectivity: 0.3,  side: THREE.DoubleSide  });
    var material, idSibling, idMesh;

    if (texture.image) {
        material = AC3D.materialManager.getMaterial();
        //material.map = texture;
        material.uniforms.map.value = texture;
        // material.uniforms.map.value.needsUpdate = true;
        material.textureWidth = texture.image.naturalWidth;
        material.textureHeight = texture.image.naturalHeight;
        if (this.root) {
            this.root.increaseUsedTexture(material.textureWidth, material.textureHeight);
        }

        this.materialsUsed.push(material);
        /** check if the texture is used by an already loaded geometry*/
        for (idSibling = 0;  idSibling < this.siblings.length; idSibling += 1) {
            /** the children here are actually geometry buffers of a same node. No link with the LOD Tree*/
            for (idMesh = 0;  idMesh < this.siblings[idSibling].geometryGroup.children.length; idMesh += 1) {
                if (this.siblings[idSibling].geometryGroup.children[idMesh].geometry.textureUsed === texture.name) {
                    this.siblings[idSibling].geometryGroup.children[idMesh].material = material;
                }
            }
        }
        this.numberOfFilesLoaded += 1;
        //TO DO: fix this.numberOfFilesLoaded can be greater than this.numberOfFilesToLoad
        //I believe I fixed it: addTexture was incrementing the numberOfFilesLoaded twice
        if (this.numberOfFilesLoaded >= this.numberOfFilesToLoad) {
            if (this.root && this.root.debugVerbose === true) {
                console.log("All Siblings from " + this.url + " Loaded");
            }
            this.loadingFinished();
        }
    } else {
        AC3D.textureManager.returnTexture(texture);
        this.onLoadingError("No image");
    }
};

AC3D.PagedLOD.prototype.addGeometry = function (geometry, nodeName) {
    var idNode = -1, idSibling = 0, idMaterial, idCurrentMaterial, newMesh;
    while (idNode === -1 && idSibling < this.siblings.length) {
        if (this.siblings[idSibling].name === nodeName) {
            idNode = idSibling;
        }
        idSibling += 1;
    }

    if (idNode >= 0) {
        /** check if the needed texture was already loaded*/
        idMaterial = -1;
        idCurrentMaterial = 0;
        while (idMaterial === -1 && idCurrentMaterial < this.materialsUsed.length) {
            if (this.materialsUsed[idCurrentMaterial].uniforms.map.value.name === geometry.textureUsed) {
                idMaterial = idCurrentMaterial;
            }
            idCurrentMaterial += 1;
        }
        //set the geometry bounding box the same as the node's
        //geometry.setBoundingSphere(this.siblings[idNode].sphereCenter.x, this.siblings[idNode].sphereCenter.y, this.siblings[idNode].sphereCenter.z, this.siblings[idNode].sphereRadius);
        if (idMaterial >= 0) {
            newMesh = new THREE.Mesh(geometry, this.materialsUsed[idMaterial]);
        } else {
            newMesh = new THREE.Mesh(geometry, AC3D.material_noTexture);
        }/* else {
            newMesh = new THREE.Mesh(geometry, AC3D.material_Wireframe, THREE.LinePieces); //indices are all wrong for gl.Lines!
        }*/
        newMesh.matrixAutoUpdate = false;

        this.siblings[idNode].addMesh(newMesh);
    }
    this.numberOfFilesLoaded += 1;
    //TO DO: fix this.numberOfFilesLoaded can be greater than this.numberOfFilesToLoad
    //I believe I fixed it: addTexture was incrementing the numberOfFilesLoaded twice
    if (this.numberOfFilesLoaded >= this.numberOfFilesToLoad) {
        if (this.root && this.root.debugVerbose === true) {
            console.log("All Siblings from " + this.url + " Loaded");
        }
        this.loadingFinished();
    }
};

/**
 * return false if the pagedLOD cannot be  downloaded because no more resources
 */
AC3D.PagedLOD.prototype.loadLOD = function (idChild) {
    var worker;
    if (this.loadedRequested) {
        return true;
    }

    if ((AC3D.toProcessImages.length > 50 && AC3D.freeImages === 0) || AC3D.toProcessGeometries.length > 50) {
        this.loadedRequested = false;
        return false;
    }

    if (this.root.useWorker) {
        worker = AC3D.workerManager.getWorker();
        if (worker === undefined) {
            this.loadedRequested = false;
            return false;
        }
    }
    if (idChild !== null && idChild !== undefined) {
        this.parentIDInSiblinghood = idChild;
    }
    this.loadedRequested = true;

    this.loaderCTM = AC3D.ctmLoaderManager.getLoader();//new AC3D.CTMLoader();//
    this.loaderCTM.load(this.root.serverPath + this.subfolder + this.url, this,
            { useWorker:  this.root.useWorker, binWorker: worker});//useWorker:  this.root.useWorker
    return true;
};


AC3D.PagedLOD.prototype.addSibling_downloadQueue = function (idSibling, distanceFromOptimumSize) {
    if (!this.root) {
        return;
    }

    //only add to queue siblinghoods that where not loaded
    var nbChildren = this.siblingChildren[idSibling].children.length, idChild, loadNeeded;

    loadNeeded = false;
    for (idChild = 0; idChild < nbChildren; idChild += 1) {
        if (this.siblingChildren[idSibling].children[idChild].loadedRequested === false) {
            loadNeeded = true;
            break;
        }
    }
    //siblings distance to center is in the this.siblingsOrder
    /*for (idSiblingOrder = 0; idSiblingOrder < nbSiblings; idSiblingOrder += 1) {
        if (this.siblingsOrder[idSiblingOrder][0] === idSibling) {
            this.root.addToDownloadQueue(this, this.siblingsOrder[idSiblingOrder][1], this.level, idSibling);
            break;
        }
    }*/
    if (loadNeeded) {
        this.root.addToDownloadQueue(this, distanceFromOptimumSize, this.level, idSibling);
    }
};

/**
 * return false if any of the pagedLOD cannot be  downloaded because no more resources
 */
AC3D.PagedLOD.prototype.loadSiblingChildren = function (idSibling) {
    var nbChildren = this.siblingChildren[idSibling].children.length, idChild, loadLaunched;

    loadLaunched = true;
    for (idChild = 0; idChild < nbChildren; idChild += 1) {
        if (this.siblingChildren[idSibling].children[idChild].loadedRequested === false) {
            loadLaunched = loadLaunched && this.siblingChildren[idSibling].children[idChild].loadLOD();
        }
    }
    return loadLaunched;
};

AC3D.PagedLOD.prototype.isSiblingVisibleInFrustum = function (frustum, idSibling) {
    var siblingSphere;
    //Use the node sphere to determine if it's in the frustum
    siblingSphere = this.siblings[idSibling].getNodeBoundingSphere();
    if (siblingSphere) {
        if (frustum.intersectsSphere(siblingSphere)) {
            return true;
        }
    }

    return false;
    /*if (this.siblingVisibleByFrustum[idSibling] === false && this.siblings[idSibling].children.length) {
        for (idGeom = 0; idGeom < this.siblings[idSibling].geometryGroup.children.length; idGeom += 1) {
            nbGeometries += 1;
            if (frustum.intersectsObject(this.siblings[idSibling].geometryGroup.children[idGeom])) {
                return true;
            }
        }
    }*/
};
AC3D.PagedLOD.prototype.updateVisibleByFrustum = function (frustum) {
    var idSibling;
    for (idSibling = 0; idSibling < this.siblings.length; idSibling  += 1) {
        this.siblingVisibleByFrustum[idSibling] = this.isSiblingVisibleInFrustum(frustum, idSibling);
    }
};

AC3D.PagedLOD.prototype.getBBoxFromSiblings = function () {
    var bbox, idSibling, siblingSphere, sphereMin, sphereMax;
    bbox = new THREE.Box3();

    sphereMin = new THREE.Vector3(Infinity, Infinity, Infinity);
    sphereMax = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
    for (idSibling = 0; idSibling < this.siblings.length; idSibling  += 1) {
        siblingSphere = this.siblings[idSibling].getNodeBoundingSphere();
        if (siblingSphere) {
            sphereMin.set(siblingSphere.center.x - siblingSphere.radius, siblingSphere.center.y - siblingSphere.radius, siblingSphere.center.z - siblingSphere.radius);
            sphereMax.set(siblingSphere.center.x + siblingSphere.radius, siblingSphere.center.y + siblingSphere.radius, siblingSphere.center.z + siblingSphere.radius);
            bbox.min.min(sphereMin);
            bbox.max.max(sphereMax);
        }
    }
    return bbox;

};

AC3D.PagedLOD.prototype.sortByDistToCenter  = function (camera_matrixWorldInverse, camera_focal_length, height) {
    if (!this.siblingsOrder) {
        return; //this should not be possible (?)
    }
    var i, l, key, positionCamera, diameterPixels, maxDistance;

    positionCamera = new THREE.Vector3();
    maxDistance = -Infinity;
    for (i = 0, l = this.siblingsOrder.length; i < l; i  += 1) {
        key = this.siblingsOrder[i][0];
        if (this.siblingVisibleByFrustum[key] === true) {
            positionCamera.copy(this.siblings[key].sphereCenter).applyMatrix4(camera_matrixWorldInverse);
            this.siblingsOrder[i][1] = positionCamera.x * positionCamera.x + positionCamera.y * positionCamera.y + positionCamera.z * positionCamera.z;
            if (maxDistance < this.siblingsOrder[i][1]) {
                maxDistance = this.siblingsOrder[i][1];
            }
        } else {
            this.siblingsOrder[i][1] = Infinity;
        }
    }
    if (this.root.orderByPixelRadius) {
        for (i = 0, l = this.siblingsOrder.length; i < l; i  += 1) {
            key = this.siblingsOrder[i][0];
            if (this.siblingsOrder[i][1] !== Infinity) {
                diameterPixels = (this.siblings[key].sphereRadius * height * camera_focal_length) / Math.abs(positionCamera.z);
                diameterPixels = (diameterPixels - this.siblings[key].maxLODRange) / diameterPixels;
                this.siblingsOrder[i][1] =  this.siblingsOrder[i][1] / maxDistance +  diameterPixels;
            }
        }
    }
    this.siblingsOrder.sort(function (a, b) { return a[1] - b[1]; });
};

AC3D.PagedLOD.prototype.traverseSiblingChildren = function (idSibling, frustum, camera_matrixWorldInverse, camera_focal_length, height, outOfFrustum) {
    /** TO DO: see if ordering the (eventual) children of a sibling is needed*/
    var idChild;
    for (idChild = 0; idChild < this.siblingChildren[idSibling].children.length; idChild += 1) {
        this.siblingChildren[idSibling].children[idChild].updatePagedLODTree(frustum, camera_matrixWorldInverse, camera_focal_length, height, outOfFrustum);
    }
};

AC3D.PagedLOD.prototype.traverseChildrenByDistToCenter = function (frustum, camera_matrixWorldInverse, camera_focal_length, height, outOfFrustum) {
    if (!this.siblingsOrder) {
        return; //this should not be possible (?)
    }
    var idSibling, key, value;
    for (idSibling = 0; idSibling < this.siblingsOrder.length; idSibling += 1) {
        key = this.siblingsOrder[idSibling][0];
        value = this.siblingsOrder[idSibling][1];
        if (value !== Infinity) {
            this.traverseSiblingChildren(key, frustum, camera_matrixWorldInverse, camera_focal_length, height, outOfFrustum);
        }
    }
};

/**
 * Update one node from the current siblinghood. 
 * If a node pixel range is greater than its maximum pixel range, call for the loading of its children.
 * 
 * Called by updatePagedLODTree(). 
 * 
 * @param idSibling {Number} the position in the siblings array of the node to be updated.
 * @param frustum {THREE.Frustum}
 * @param camera_matrixWorldInverse {THREE.Matrix4}
 * @param camera_focal_length {Number}
 * @param height {Number}
 */
AC3D.PagedLOD.prototype.updateSiblingLODTree = function (idSibling, frustum, camera_matrixWorldInverse, camera_focal_length, height, outOfFrustum) {
    var pixelRatio, diameterPixels, maxRange;
    pixelRatio = 1;
    if (this.root && this.root.pixelRatio) {
        pixelRatio = this.root.pixelRatio;
    }
    this.siblings[idSibling].ancestorVisible = false;
    //the visibility in the current frustum was already checked
    if (this.siblingVisibleByFrustum[idSibling] === false || outOfFrustum === true) {//
        if (this.siblings[idSibling].visible) {
            this.siblings[idSibling].lastSeen = Date.now();
            this.siblings[idSibling].setVisible(false);
        }

        //this.ancestorVisible = this.LODParent.ancestorVisible;//ancestorVisible is false
        //If the sibling is not visible in the frustum, this means that all children are invisible also. Avoid computation of frustum by using outOfFrustum value
        this.traverseSiblingChildren(idSibling, frustum, camera_matrixWorldInverse, camera_focal_length, height, true);
        return;
    }

//  The Vector3 is interpreted as position (w = 1);
    //TO DO: I think the diameterPixels is already computed for the sorting. Use that 
    this.siblings[idSibling].sphereInCameraCoord.copy(this.siblings[idSibling].sphereCenter).applyMatrix4(camera_matrixWorldInverse);
    /** 1 unit GL at position P is projected to X pixels on screen, where the equation is
     * 1 unit = (screenHeight * f)/(2*abs(camera coordinates of P.z))  pixels
     * projectionMatrix[5] = f = 1.0/tan(fieldOfView()/2.0);
     * */
    diameterPixels = (this.siblings[idSibling].sphereRadius * height * camera_focal_length) / Math.abs(this.siblings[idSibling].sphereInCameraCoord.z);
    maxRange = pixelRatio * this.siblings[idSibling].maxLODRange;

    if (maxRange > diameterPixels) {
        this.siblings[idSibling].setVisible(true);
        //console.log("last seen "+(Date.now()- this.lastSeen) + " ms");
        this.siblings[idSibling].ancestorVisible = true;
    } else {//if (the sibling maxLODRange < diameterPixels)
        if (this.siblingChildren[idSibling].children.length > 0) {
            if (this.siblings[idSibling].numberChildrenLoaded < this.siblingChildren[idSibling].children.length) {
                this.siblings[idSibling].setVisible(true);
                this.siblings[idSibling].ancestorVisible = true;
                //overwrite diameterPixels!
                if (maxRange >= 1.0) {
                    diameterPixels = (diameterPixels - maxRange) / maxRange;
                }
                this.addSibling_downloadQueue(idSibling, diameterPixels);
            } else {
                if (this.siblings[idSibling].visible) {
                    this.siblings[idSibling].lastSeen = Date.now();
                }
                this.siblings[idSibling].setVisible(false);
            }
        } else {/** The node is a leaf*/
            this.siblings[idSibling].setVisible(true);
            this.siblings[idSibling].ancestorVisible = true;
        }
    }
    this.traverseSiblingChildren(idSibling, frustum, camera_matrixWorldInverse, camera_focal_length, height, outOfFrustum);
};

/**
 * 
 */
AC3D.PagedLOD.prototype.intersectPagedLOD = function (raycaster, intersects) {
    var idSibling, idChild, l, i, child;
    for (idSibling = 0; idSibling < this.siblings.length; idSibling += 1) {
        if (this.siblings[idSibling].visible === true) {
            l = this.siblings[idSibling].geometryGroup.children.length;
            for (i = 0; i < l; i += 1) {
                child = this.siblings[idSibling].geometryGroup.children[i];
                child.raycast(raycaster, intersects);
            }
        }
    }
    for (idSibling = 0; idSibling < this.siblingChildren.length; idSibling += 1) {
        for (idChild = 0; idChild < this.siblingChildren[idSibling].children.length; idChild += 1) {
            this.siblingChildren[idSibling].children[idChild].intersectPagedLOD(raycaster, intersects);
        }
    }
};

/**
 * Traverse the LOD Tree, in a depth-first manner, and update the visibility of the nodes. 
 * If a node pixel range is greater than its maximum pixel range, call for the loading of its children.
 * 
 * @param frustum {THREE.Frustum}
 * @param camera_matrixWorldInverse {THREE.Matrix4}
 * @param camera_focal_length {Number}
 * @param height {Number}
 */
AC3D.PagedLOD.prototype.updatePagedLODTree = function (frustum, camera_matrixWorldInverse, camera_focal_length, height, outOfFrustum) {
    /**
     * If the PagedLOD is not loaded, this is a leaf node.
     * Error check: 
     * After a loading error, the PagedLOD is blocked from requesting a new load for a time, indicated by "waitAfterError". 
     * Here, check if an error occurred previously, and if it's now time to unblock the PagedLOD.  
     */
    if (!this.loaded) {
        if (this.loadingError === true) {
            if ((Date.now() - this.lastError) > this.waitAfterError) {
                this.unblockNodeForLoading();
            }
        }
        return;
    }
    /**If a parent was out of frustum, all children should be out of frustum*/
    if (outOfFrustum === true) {
        this.setVisible(false);
        this.traverseChildrenByDistToCenter(frustum, camera_matrixWorldInverse, camera_focal_length, height, outOfFrustum);
        return;
    }

    /**
     * Check if an ancestor is visible. If yes, this means that all the descendants should be invisible.
     * set the current descendant to invisible, and call the update of the subtree. 
     */
    if (this.LODParent !== null && this.LODParent.ancestorVisible === true) {
        this.setVisible(false);
        this.traverseChildrenByDistToCenter(frustum, camera_matrixWorldInverse, camera_focal_length, height, outOfFrustum);
        return;
    }

    /**
     * The PagedLOD is likely to be visible. Before updating the siblings:
     * 1) test if siblings are visible in the frustum or not
     * 2) sort them by distance to center/camera. 
     * This prioritizes the loading of the "most visible" siblings.
     */
    this.updateVisibleByFrustum(frustum);
    var idSibling, key;
    this.sortByDistToCenter(camera_matrixWorldInverse, camera_focal_length, height);
    for (idSibling = 0; idSibling < this.siblingsOrder.length; idSibling += 1) {
        key = this.siblingsOrder[idSibling][0];
        /**
         * Update all siblings. If the sibling is invisible, the call will traverse 
         */
        this.updateSiblingLODTree(key, frustum, camera_matrixWorldInverse, camera_focal_length, height, false);
    }
    return;


    /** TO DO: is this useful? Don't know for what? 
if (!this.visible) {
this.traverseChildrenByDistToCenter(frustum, camera_matrixWorldInverse, camera_focal_length, height,
maxDiameter, zNear);
return;
}

if (!this.localGeometry || !this.localGeometry.geometry) {
this.traverseChildrenByDistToCenter(frustum, camera_matrixWorldInverse, camera_focal_length, height,
maxDiameter, zNear);
return; //in place of if (a == undefined || a == null) use if (!a)
}
     */
};

AC3D.PagedLOD.prototype.getLastestSeen = function () {
    if (!this.siblings.length) {
        return -Infinity;
    }

    var lastSeen, idSibling;
    lastSeen = this.siblings[0].lastSeen;

    for (idSibling = 1; idSibling < this.siblings.length; idSibling += 1) {
        if (this.siblings[idSibling].lastSeen > lastSeen) {
            lastSeen = this.siblings[idSibling].lastSeen;
        }
    }
    return lastSeen;
};

AC3D.PagedLOD.prototype.getIsSiblingVisible = function () {
    if (!this.siblings.length) {
        return false;
    }
    var visible, idSibling;
    visible = this.siblings[0].visible;
    idSibling = 1;
    /** if at least one sibling is visible, return true*/
    while (visible === false && idSibling < this.siblings.length) {
        visible = this.siblings[idSibling].visible;
        idSibling += 1;
    }

    return visible;
};

AC3D.PagedLOD.prototype.getNumberChildrenLoaded = function () {
    if (!this.siblings.length) {
        return 0;
    }
    var numberChildrenLoaded, idSibling;
    numberChildrenLoaded = 0;
    for (idSibling = 0; idSibling < this.siblings.length; idSibling += 1) {
        numberChildrenLoaded += this.siblings[idSibling].numberChildrenLoaded;
    }

    return numberChildrenLoaded;
};

AC3D.PagedLOD.prototype.clearSiblingsArrays = function () {
    /** TO DO: maybe clearing should be all put into a "clear" single function? */

    /** Clear arrays. 
     * Apparently using this loop is the fastest method that ensures the array is truly cleared. 
     * Setting a = [] creates a new array. Any references to the old array preserve the data */
    var node, childrenGroup, child, i, l;
    while (this.siblings.length > 0) {
        node = this.siblings.pop();
        node.deleteData();
        AC3D.nodeManager.returnNode(node);
        //node = null;
    }
    while (this.siblingsOrder.length > 0) {
        this.siblingsOrder.pop();
    }
    while (this.siblingVisibleByFrustum.length > 0) {
        this.siblingVisibleByFrustum.pop();
    }
    while (this.siblingChildren.length > 0) {
        childrenGroup = this.siblingChildren.pop();
        /**a sibling children object is a THREE.Group, where the group's children are PagedLOD objects.*/
        l = childrenGroup.children.length;
        for (i = l - 1; i >= 0; i -= 1) {
            child = childrenGroup.children[i];
            childrenGroup.remove(child);
            child.deleteData();
            child.root = null;
            child.LODParent = null;
            /** TO DO: check if dispose can be added? remove signals, if any needed? */
            AC3D.pagedLODManager.returnPagedLOD(child);
        }
        AC3D.groupManager.returnGroup(childrenGroup);
    }
};

AC3D.PagedLOD.prototype.clearMaterialsUsed = function () {
    var material;
    while (this.materialsUsed.length > 0) {
        material = this.materialsUsed.pop();
        if (material.uniforms.map.value) {
            material.uniforms.map.value.dispose();
            material.uniforms.map.value.image = null;
            AC3D.textureManager.returnTexture(material.uniforms.map.value);
            //delete material.uniforms.map.value;
            if (this.root) {
                this.root.decreaseUsedTexture(material.textureWidth, material.textureHeight);
            }
            //this.localGeometry.material.dispose();
            material.uniforms.map.value = null;
        }
        AC3D.materialManager.returnMaterial(material);
    }
};

AC3D.PagedLOD.prototype.deleteData = function () {
    if (this.root && this.root.debugVerbose === true) {
        console.log("Delete data of " + this.url);
    }
    this.clearSiblingsArrays();
    this.clearMaterialsUsed();
    this.children = [];

    this.loaded = false;
    this.loadedRequested = false;

    /*this.level = -1;

this.url = "";
this.subfolder = "";
this.root = null;

this.LODParent = null;*/
    this.numberOfFilesToLoad = 0;
    this.numberOfFilesLoaded = 0;
    this.loadingError = false;
    this.lastError = 0;
    this.parentIDInSiblinghood = null;
    this.loaderCTM = null;

//  this.lastSeen = -Infinity;
//  this.numberChildrenLoaded = 0;
//  this.textureWidth = 0;
//  this.textureHeight = 0;

//  this.textureLoaded = false;
//  this.geometryLoaded = false;
//  this.textureError = false;
//  this.geometryError = false;
    //console.log("deleted ... "+this.url);
};

/**
 * @param idSibling {Number} the position in the siblings array of the node to be updated.
 * @param frustum {THREE.Frustum}
 * @param camera_matrixWorldInverse {THREE.Matrix4}
 * @param camera_focal_length {Number}
 * @param height {Number}
 */
AC3D.PagedLOD.prototype.removeSiblingExpiredChildren = function (idSibling, frustum, camera_matrixWorldInverse, camera_focal_length, height) {
    var childrenExist, nbChildren, idChild, timeNotSeen, visibleByFrustum, diameterPixels, l, i, pixelRatio;

    childrenExist = 0;
    /**
     * Check if any children is not deletable. 
     * 1) The child is visible or was visible recently
     * 2) The child is in the process of being loaded
     * 3) The child has un-deleted children of its own 
     */
    nbChildren = this.siblingChildren[idSibling].children.length;
    for (idChild = 0; idChild < nbChildren; idChild += 1) {
        timeNotSeen = this.root.frameTimestamp - this.siblingChildren[idSibling].children[idChild].getLastestSeen();
        if (this.siblingChildren[idSibling].children[idChild].loaded &&
                (this.siblingChildren[idSibling].children[idChild].getIsSiblingVisible() ||
                        timeNotSeen < this.root.expiryTime)) {
            childrenExist += 1;
        } else if (this.siblingChildren[idSibling].children[idChild].loadedRequested && !this.siblingChildren[idSibling].children[idChild].loaded) {
            /**Load requested, but not yet loaded*/
            childrenExist += 1;
        } else if (this.siblingChildren[idSibling].children[idChild].getNumberChildrenLoaded() > 0) {
            /**NumberChildrenLoaded indicate that for an invisible node, there are children that are visible (so the node should not be deleted!)*/
            childrenExist += 1;
        }
    }


    if (childrenExist === 0) {
        /**
         * Check if  parent visible in frustum and diameter in pixels bigger than the parent range, 
         * but all children outside the frustum. In this case, don't delete children, because they will be reloaded
         */
        visibleByFrustum = this.isSiblingVisibleInFrustum(frustum, idSibling);

        if (visibleByFrustum) {
            pixelRatio = 1;
            if (this.root && this.root.pixelRatio) {
                pixelRatio = this.root.pixelRatio;
            }

            this.siblings[idSibling].sphereInCameraCoord.copy(this.siblings[idSibling].sphereCenter).applyMatrix4(camera_matrixWorldInverse);
            diameterPixels = (this.siblings[idSibling].sphereRadius * height * camera_focal_length) / Math.abs(this.siblings[idSibling].sphereInCameraCoord.z);
            if (pixelRatio * this.siblings[idSibling].maxLODRange < diameterPixels) {
                return;
            }
        }

        l = this.siblingChildren[idSibling].children.length;
        for (i = l - 1; i >= 0; i -= 1) {
            /** TO DO: check if dispose can be added? remove signals, if any needed? */
            if (this.siblingChildren[idSibling].children[i].loaded) {
                this.siblingChildren[idSibling].children[i].deleteData();
            }
        }

        this.siblings[idSibling].numberChildrenLoaded = 0;
    }
};

//force delete all data
AC3D.PagedLOD.prototype.unload = function () {
    var idSibling, nbChildren, idChild, i, l;
    idSibling = 0;

    //cancel loading the node data
    if (this.loaderCTM) {
        if (this.loaderCTM.xhr) {
            this.loaderCTM.xhr.abort();
        }
        this.loaderCTM = null;
    }

    for (idSibling = 0; idSibling < this.siblings.length; idSibling += 1) {
        nbChildren = this.siblingChildren[idSibling].children.length;
        for (idChild = 0; idChild < nbChildren; idChild += 1) {
            this.siblingChildren[idSibling].children[idChild].unload();
        }
    }

    for (idSibling = 0; idSibling < this.siblings.length; idSibling += 1) {
        l = this.siblingChildren[idSibling].children.length;
        for (i = l - 1; i >= 0; i -= 1) {
            this.siblingChildren[idSibling].children[i].deleteData();
        }
        this.siblings[idSibling].numberChildrenLoaded = 0;
        //make sure the level 0 is visible, because it is not deleted
        this.siblings[idSibling].setVisible(true);
    }
};

/**
 * 
 * @param frustum {THREE.Frustum}
 * @param camera_matrixWorldInverse {THREE.Matrix4}
 * @param camera_focal_length {Number}
 * @param height {Number}
 */
AC3D.PagedLOD.prototype.removeExpiredChildren = function (frustum, camera_matrixWorldInverse, camera_focal_length, height) {
    var idSibling, nbChildren, idChild;
    idSibling = 0;
    for (idSibling = 0; idSibling < this.siblings.length; idSibling += 1) {
        nbChildren = this.siblingChildren[idSibling].children.length;
        for (idChild = 0; idChild < nbChildren; idChild += 1) {
            this.siblingChildren[idSibling].children[idChild].removeExpiredChildren(frustum, camera_matrixWorldInverse, camera_focal_length, height);
        }
    }

    for (idSibling = 0; idSibling < this.siblings.length; idSibling += 1) {
        this.removeSiblingExpiredChildren(idSibling, frustum, camera_matrixWorldInverse, camera_focal_length, height);
    }
};
/*jslint browser: true*/
/*jslint indent: 4 */
/*jslint todo: true */
/*global AC3D,THREE, Uint16Array*/
"use strict";

/** @constructor */
AC3D.Node = function (name) {
    THREE.Group.call(this);

    this.sphereCenter = new THREE.Vector3();
    this.sphereInCameraCoord = new THREE.Vector3();
    this.matrixAutoUpdate = false;
    this.nodeBoundingSphere = null; //Add a Bounding Sphere for frustum testing

    this.wireframeGroup = new THREE.Group();
    this.geometryGroup = new THREE.Group();
    this.showWireframe = false;
    this.add(this.geometryGroup);
    this.add(this.wireframeGroup);

    this.init(name);
};

AC3D.Node.prototype = Object.create(THREE.Group.prototype);

AC3D.Node.prototype.init = function (name) {
    this.name = name;
    this.sphereRadius = 0;
    this.ancestorVisible = false;
    this.numberChildrenLoaded = 0;
    this.lastSeen = -Infinity;

    this.maxLODRange = 0;
    this.minLODRange = 0;
    this.sphereCenter.set(0, 0, 0);
    this.sphereInCameraCoord.set(0, 0, 0);
};

AC3D.Node.prototype.setVisible = function (visible) {
    this.visible = visible;
    var l, i, child;
    if (AC3D.showWireframe === true && this.showWireframe === false) {
        l = this.geometryGroup.children.length;
        for (i = 0; i < l; i += 1) {
            child = this.geometryGroup.children[i];
            if (child instanceof THREE.Mesh) {/** it should always be a Mesh */
                this.createWireframeMesh(child);
                child.material.polygonOffset = true;
            }
        }
        this.showWireframe = true;
    } else if (AC3D.showWireframe === false && this.showWireframe === true) {
        this.deleteWireframeData();

        l = this.geometryGroup.children.length;
        for (i = 0; i < l; i += 1) {
            child = this.geometryGroup.children[i];
            if (child instanceof THREE.Mesh) {/** it should always be a Mesh */
                child.material.polygonOffset = false;
            }
        }
        this.showWireframe = false;
    }
};

AC3D.Node.prototype.setNodeBoundingSphere = function (sphereCenter_x, sphereCenter_y, sphereCenter_z, maxRadius) {
    if (this.nodeBoundingSphere === null) {
        this.nodeBoundingSphere = THREE.SPHERE_MANAGER.getSphere();
    }

    this.nodeBoundingSphere.center.set(sphereCenter_x, sphereCenter_y, sphereCenter_z);
    this.nodeBoundingSphere.radius = maxRadius;

    if (isNaN(this.nodeBoundingSphere.radius)) {
        this.nodeBoundingSphere.radius = 0;
    }
};

AC3D.Node.prototype.setNodeBoundingSphereFromNodeData = function () {
    this.setNodeBoundingSphere(this.sphereCenter.x, this.sphereCenter.y, this.sphereCenter.z, this.sphereRadius);
};

AC3D.Node.prototype.getNodeBoundingSphere = function () {
    //re-set the bounding sphere; 
    //I don't know why, but the sphere is kept properly if only initialized in the beginning.
    this.setNodeBoundingSphereFromNodeData();
    this.nodeBoundingSphere.applyMatrix4(this.matrixWorld);
    return this.nodeBoundingSphere;
};

AC3D.Node.prototype.addMesh = function (newMesh) {
    this.geometryGroup.add(newMesh);
    if (AC3D.showWireframe && this.showWireframe) {
        this.createWireframeMesh(newMesh);
        newMesh.material.polygonOffset = true;
    }
};

AC3D.Node.prototype.createWireframeMesh = function (mesh) {
    var wireframeGeometry, triangleIndex, triangleLength, lineLength, meshWireframe, offset, i;
    wireframeGeometry = new THREE.BufferGeometry();
    wireframeGeometry.attributes.position = mesh.geometry.attributes.position;

    triangleIndex = mesh.geometry.attributes.index.array;
    triangleLength = triangleIndex.length;

    if (triangleLength) {
        lineLength = 2 * triangleLength;
        wireframeGeometry.addAttribute('index', new THREE.BufferAttribute(new Uint16Array(lineLength), 1));
        offset = 0;
        for (i = 0; i < triangleLength; i += 3) {
            wireframeGeometry.attributes.index.array[offset] = triangleIndex[i];
            wireframeGeometry.attributes.index.array[offset + 1] = triangleIndex[i + 1];
            wireframeGeometry.attributes.index.array[offset + 2] = triangleIndex[i + 1];
            wireframeGeometry.attributes.index.array[offset + 3] = triangleIndex[i + 2];
            wireframeGeometry.attributes.index.array[offset + 4] = triangleIndex[i + 2];
            wireframeGeometry.attributes.index.array[offset + 5] = triangleIndex[i];
            offset += 6;
        }
        meshWireframe = new THREE.Mesh(wireframeGeometry,  AC3D.material_wireframe);
        this.wireframeGroup.add(meshWireframe);
    }
};

AC3D.Node.prototype.deleteWireframeData = function () {
    var l, i, child;
    l = this.wireframeGroup.children.length;

    for (i = l - 1; i >= 0; i -= 1) {
        child = this.wireframeGroup.children[i];
        if (child instanceof THREE.Mesh) {/** it should always be a Mesh */
            this.wireframeGroup.remove(child);//calls this.children.pop();
            /** Checked: the geometry is BufferGeometry
             * TO DO: if either geometry or texture are null, there was an error of loading! Should deal with it*/
            if (child.geometry) {
                //make sure the positions are shared. 
                //Dispose deletes the WebGL buffer, but since there is another reference, it is actually not deleted? Or it is re-created!                 
                /*if(child.geometry.attributes.position.buffer !== this.geometryGroup.children[i].geometry.attributes.position.buffer){
                    console.log("Buffer "+child.geometry.attributes.position.buffer + "!= "+this.geometryGroup.children[i].position.buffer);
                }*/
                child.geometry.dispose();
            }

            child.material = null;
            child.geometry = null;
            child = null;
        }
    }
    this.showWireframe = false;
};

AC3D.Node.prototype.deleteData = function () {
    this.deleteWireframeData();

    var l, i, child;
    l = this.geometryGroup.children.length;
    for (i = l - 1; i >= 0; i -= 1) {
        child = this.geometryGroup.children[i];
        if (child instanceof THREE.Mesh) {/** it should always be a Mesh */
            this.geometryGroup.remove(child);//calls this.children.pop();
            //renderer.deallocateGeometry(this.localGeometry.geometry); /** same thing as calling directly object.dispose */
            //renderer.deallocateObject(this.localGeometry);
            /** Checked: the geometry is BufferGeometry
             * TO DO: if either geometry or texture are null, there was an error of loading! Should deal with it*/
            if (child.geometry) {
                child.geometry.dispose();
            }

            child.material = null;
            child.geometry = null;
            child = null;
        }
    }
    //this.remove(this.geometryGroup); (don't remove the geometry and wireframe nodes)

    if (this.nodeBoundingSphere !== null) {
        THREE.SPHERE_MANAGER.returnSphere(this.nodeBoundingSphere);
        /**
         * Careful with deinitializing all data before releasing! Not setting the sphere to null was creating problems, because the sphere was written twice!
         */
        this.nodeBoundingSphere = null;
    }
};