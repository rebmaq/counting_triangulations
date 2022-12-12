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

// Clear and resize the canvas on window resize
addEventListener('resize', () => {
    points = [];
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    c.translate(0, canvas.height);
    c.scale(1, -1)
})

// When the canvas is clicked clear the redo stack, and add a point
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


addEventListener('touchstart', (event) => {
    let rect = canvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    if(y < 0){
        return;
    }
    poppedPoints = [];
    addPoint(x, y);
})

// On Ctrl-z, undo; on ctrl-y, redo
addEventListener('keydown', (event) => {
    if(event.ctrlKey && event.key == 'z') {
        undo();
    }
    else if(event.ctrlKey && event.key == 'y') {
        redo();
    }
})

// Clear the canvas, and display the values in the points array
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

// Add a point to the points array
function addPoint(x, y){
    y = -y + canvas.height
    points.push([x, y]);    
    renderPoints();
}

// Remove an added point from the points array
function undo(){
    if(points.length == 0){
        return;
    }
    poppedPoints.push(points.pop());
    renderPoints();
}

// Restore the most recently removed point back into the points array
function redo(){
    if(poppedPoints.length == 0){
        return;
    }
    addPoint(...poppedPoints.pop());
    renderPoints();
}

// Clear the points array and the redo stack and clear the canvas
function clearCanvas(){
    points = []
    poppedPoints = []
    c.clearRect(0, 0, canvas.width, canvas.height);
}

// Calculate the number of unique triangulations
function enumerateTriangulations(){
    if(isSimple()){
        console.log("Triangulating.");

        // find an edge such that it is to the right of all other points
        let i = 0;
        for(; i < points.length + 2; i++){
            let leftSet = getLeftSet(points[mod(i, points.length)], points[mod(i + 1, points.length)]);
            if(leftSet.length == points.length - 2){
                break;
            }
        }
        if(i == points.length + 2){ // Traverse the array in counter clockwise order
            points = points.reverse();
            i = 0;
            for(; i < points.length + 2; i++){
                let leftSet = getLeftSet(points[mod(i, points.length)], points[mod(i + 1, points.length)]);
                if(leftSet.length == points.length - 2){
                    break;
                }
            }
        }
        alert(`There are ${triangulate(points[mod(i, points.length)], points[mod(i + 1, points.length)])} unique triangulations`);
        points = points.reverse();
        return;
    }
    alert("Please enter a valid polygon");
}

function triangulate(a, b){
    let sum = 0;
    let leftSet = getLeftSet(a, b)
    
    // Base case : segment (a, b) is the base of a triangle, or it is an edge on the boundary of the polygon 
    if(leftSet.length == 0 || leftSet.length == 1){
        return 1;
    }

    
    let baseCase = true;
    for(let i = 0; i < leftSet.length; i++){
        let i_a = points.findIndex((x) => x[0] == a[0] && x[1] == a[1]) // Get index of point a in the points array
        let i_b = points.findIndex((x) => x[0] == b[0] && x[1] == b[1]) // Get index of point b in the points array
        
        // If (a, leftSet[i]) is a valid internal diagonal or it is an incident edge to point a, and (b, leftSet[i]) is a valid internal diagonal or it is an incident edge to point b
        if((Diagonal(a, leftSet[i]) || points[mod(i_a + 1, points.length)] == leftSet[i] || points[mod(i_a - 1, points.length)] == leftSet[i])
            && (Diagonal(b, leftSet[i]) || points[mod(i_b + 1, points.length)] == leftSet[i] || points[mod(i_b - 1, points.length)] == leftSet[i])){
            baseCase = false;
            sum += triangulate(a, leftSet[i]) * triangulate(leftSet[i], b);
        }
    }

    // Base case : The leftSet is comprised of all non-viable diagonals
    if(baseCase){
        sum = 1;
    }
    return sum;
}

// Get all of the points that are to the left of edge (a, b)
function getLeftSet(a, b){
    let leftSet = [];
    for(let i = 0; i < points.length; i++){
        if(points[i] == a || points[i] == b) continue;
        if(LeftOn(a, b, points[i])){
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
        if( c != a && c1 != a && c != b &&
            c1 != b && Intersect(a, b, c, c1)){
                return false;
            }
        i += 1;
    }while(i < points.length);
    return true;
}

// Returns whether the points array represents a simple polygon
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
    let i = points.findIndex((x) => x[0] == a[0] && x[1] == a[1])

    a1 = points[mod((i + 1), points.length)];
    a0 = points[mod((i - 1), points.length)];

    if( LeftOn(a, a1, a0)) return Left(a, b, a0) && Left(b, a, a1); // a is convex
    return !(LeftOn(a, b, a1) && LeftOn(b, a, a0));
}

function Diagonal(a, b){  
    return InCone(a, b) && Diagonalie(a, b);
}