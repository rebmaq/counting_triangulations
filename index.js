// import {Left, Intersect} from "primitives.js";

let points = [];
let poppedPoints = [];

function mod(n, m){
    return ((n % m) + m) % m;
}

// getting a reference to our HTML element
const canvas = document.querySelector('canvas');
canvas.width = innerWidth;
canvas.height = innerHeight;

// initiating 2D context on it
const c = canvas.getContext('2d');
c.translate(0, canvas.height);
c.scale(1, -1)

addEventListener('resize', () => {
    points = [];
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    c.translate(0, canvas.height);
    c.scale(1, -1)
})

addEventListener('click', (event) => {
    let rect = canvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    if(y < 0){
        return;
    }
    poppedPoints = [];
    addPoint(x, y);
})

addEventListener('keydown', (event) => {
    if(event.ctrlKey && event.key == 'z') {
        undo();
    }
    else if(event.ctrlKey && event.key == 'y') {
        redo();
    }
})

function renderPoints(){
    c.clearRect(0, 0, canvas.width, canvas.height);
    if(points.length > 0){
        let x = points[0][0];
        let y = points[0][1]
        
        c.beginPath();
        c.arc(x, y, 1, 0, 2 * Math.PI, true);
        c.moveTo(x, y);
        
        for(let i = 1; i < points.length; i++){
            let x = points[i][0];
            let y = points[i][1];

            c.arc(x, y, 1, 0, 2 * Math.PI, true);
            c.lineTo(x, y);
            c.moveTo(x, y);
        }

        c.lineTo(points[0][0], points[0][1]);
        c.stroke();
    }
}

function addPoint(x, y){
    y = -y + canvas.height
    points.push([x, y]);
    // console.log("x: " + x + " y: " + y); 
    console.log("x: ", x);
    
    renderPoints();
}

function undo(){
    if(points.length == 0){
        return;
    }
    poppedPoints.push(points.pop());
    renderPoints();
}

function redo(){
    if(poppedPoints.length == 0){
        return;
    }
    addPoint(...poppedPoints.pop());
    renderPoints();
}

function clearCanvas(){
    points = []
    poppedPoints = []
    c.clearRect(0, 0, canvas.width, canvas.height);
}

function enumerateTriangulations(){
    if(isSimple()){
        console.log("Triangulating.");

        // find an edge that is to the left or right of all other points
        // alert(`There are ${triangulate(points[0], points[1])} or ${triangulate(points[1], points[0])} unique triangulations`);
        alert(`There are ${triangulate(points[0], points[1])} unique triangulations`);
        return;
    }
    alert("Please enter a valid polygon");
}

// let visited = [];
function triangulate(a, b){
    let sum = 0;
    let leftSet = getLeftSet(a, b)
    // || leftSet.length == 1
    console.log('---------------------------------------------------')
    console.log(`a: ${a[0]}, b: ${b[0]}`);
    console.log(`left set: ${leftSet.map((x) => x[0])}`)
    for(let i = 0; i < leftSet.length; i++){
        let i_a = points.findIndex( (x) => x[0] == a[0] && x[1] == a[1])
        let i_b = points.findIndex( (x) => x[0] == b[0] && x[1] == b[1])
        // console.log("i ", i)
        console.log("curr left pt", leftSet[i][0])
        // console.log(Diagonal(a, leftSet[i]))
        // console.log(Diagonal(a, leftSet[i]))
        // console.log(Diagonal(a, leftSet[i]))
        if((Diagonal(a, leftSet[i]) || points[mod(i_a + 1, points.length)] == leftSet[i] || points[mod(i_a - 1, points.length)] == leftSet[i])
         && (Diagonal(b, leftSet[i]) || points[mod(i_b + 1, points.length)] == leftSet[i] || points[mod(i_b - 1, points.length)] == leftSet[i])){
            console.log("bruh")
            sum += triangulate(a, leftSet[i]) * triangulate(leftSet[i], b);
        }
    }
    if(leftSet.length == 0){
        sum += 1;
    }
    return sum;
}

function getLeftSet(a, b){
    let leftSet = [];
    for(let i = 0; i < points.length; i++){
        if(points[i] == a || points[i] == b) continue;
        if(Left(a, b, points[i])){
            leftSet.push(points[i]);
        }
    }
    return leftSet;
}

function Area2(a, b, c){
    return (b[0] - a[0]) * (c[1] - a[1])
            - (c[0] - a[0]) * (b[1] - a[1]);
}

function Left(a, b, c){
    return Area2(a, b, c) > 0;
}

function LeftOn(a, b, c){
    return Area2(a, b, c) >= 0;
}

function Collinear(a, b, c){
    return Area2(a, b, c) == 0;
}

function Xor(x, y){
    return !x != !y;
}

function IntersectProp(a, b, c, d){
    if( Collinear(a, b, c) || Collinear(a, b, d) ||
        Collinear(c, d, a) || Collinear(c, d, b))
       return false;
    return Xor(Left(a, b, c), Left(a, b, d))
            && Xor(Left(c, d, a), Left(c, d, b));
}

function Between(a, b, c){
    if(!Collinear(a, b, c))
        return false;
    if(a[0] != b[0])
        return ((a[0] <= c[0]) && (c[0] <= b[0])) ||
               ((a[0] >= c[0]) && (c[0] >= b[0]));
    else
        return ((a[1] <= c[1]) && (c[1] <= b[1])) ||
               ((a[1] >= c[1]) && (c[1] >= b[1]));
}

function Intersect(a, b, c, d){
    if(IntersectProp(a, b, c, d))
        return true;
    else if (  Between(a, b, c)
            || Between(a, b, d)
            || Between(c, d, a)
            || Between(c, d, b)
            )
        return true;
    else return false;
}

function Diagonalie(a, b){
    let c, c1;
    let i = 0;
    do{
        c = points[mod(i, points.length)];
        c1 = points[mod((i + 1), points.length)];
        // if(c == a || c1 == a || c == b ||
        //     c1 == b){
        //         i += 1;
        //         continue
        //     }
        // console.log(`i: ${i},\ni + 1: ${i + 1},
        //             \na: ${a},\nb: ${b},\nc: ${c},\nc1: ${c1},\n
        //             intersects? ${Intersect(a, b, c, c1)}`)
        if( c != a && c1 != a && c != b &&
            c1 != b && Intersect(a, b, c, c1)){
                return false;
            }
        i += 1;
    }while(i < points.length);
    return true;
}

function isSimple(){
    if(points.length < 3){
        return false;
    }
    for(let i = 0; i < points.length; i++){
        if(!Diagonalie(points[i], points[mod((i + 1), points.length)])){
            return false;
        }
    }
    return true;
} 

function InCone(a, b){
    let a0, a1;
    let i = points.findIndex( (x) => x[0] == a[0] && x[1] == a[1])

    a1 = points[mod((i + 1), points.length)];
    console.log("a1", a1[0])
    a0 = points[mod((i - 1), points.length)];
    console.log("a0", a0[0])

    // console.log(LeftOn(a, a1, a0))
    if( LeftOn(a, a1, a0)) return Left(a, b, a0) && Left(b, a, a1); // a is convex
    return !(LeftOn(a, b, a1) && LeftOn(b, a, a0));
}

function Diagonal(a, b){
    console.log("incone", InCone(b,a))
    
    return InCone(a, b) && Diagonalie(a, b);
}