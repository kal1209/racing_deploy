import * as THREE from 'three';

export class TextSprite {
    public text: string;
    public fontSize: number;
    public color: any;
    public position: THREE.Vector3;
    public obj: THREE.Sprite;

    constructor(parameter) {
        this.text = parameter.text;
        this.fontSize = parameter.fontSize;
        this.color = parameter.color;
        this.position = parameter.position;
        
        // Create Sprite
        this.obj = this.makeTextSprite();
    }

    public makeTextSprite( )
    {
        var fontface = "Courier New";
        var fontsize = this.fontSize;
        var borderThickness = 4;
        var borderColor = { r:0, g:0, b:0, a:1.0 };
        var backgroundColor = { r:0, g:0, b:255, a:1.0 };
        var textColor = this.color

        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        context.font = "Bold " + fontsize + "px " + fontface;
        var metrics = context.measureText( this.text );
        var textWidth = metrics.width;

        context.fillStyle   = "rgba(" + backgroundColor.r + "," + backgroundColor.g + "," + backgroundColor.b + "," + backgroundColor.a + ")";
        context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + "," + borderColor.b + "," + borderColor.a + ")";
        context.fillStyle = "rgba("+textColor.r+", "+textColor.g+", "+textColor.b+", 1.0)";
        context.fillText( this.text, borderThickness, fontsize + borderThickness);

        var texture = new THREE.Texture(canvas) 
        texture.needsUpdate = true;
        // var spriteMaterial = new THREE.SpriteMaterial( { map: texture, useScreenCoordinates: false } );
        var spriteMaterial = new THREE.SpriteMaterial( { map: texture } );
        var sprite = new THREE.Sprite( spriteMaterial );
        sprite.scale.set(0.5 * fontsize, 0.25 * fontsize, 0.75 * fontsize);
        sprite.position.copy(this.position);
        sprite.center.set(0, 0);
        return sprite;  
    }
}