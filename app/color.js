
class Color {

    constructor(r, g, b, a) {

        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;

    }

    equals(color) {
        return this.r == color.r && this.g == color.g && this.b == color.b && this.a == color.a;
    }

}

module.exports = Color;
