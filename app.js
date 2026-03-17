function renderWeek(){

const div=document.getElementById("rentals")
div.innerHTML=""

let base=getMonday(new Date())
base.setDate(base.getDate()+weekOffset*7)

let dates=[]
for(let i=0;i<7;i++){
let d=new Date(base)
d.setDate(base.getDate()+i)
dates.push(format(d))
}

let html="<h3>Vecka "+getWeekNumber(base)+"</h3>"

html+="<table><tr><th>Skida</th>"

dates.forEach(d=>{
html+="<th>"+d.substring(5)+"</th>"
})

html+="</tr>"

skis.forEach(ski=>{

html+="<tr><td>"+ski.length+" cm</td>"

dates.forEach(day=>{

let found=null

for(let r of rentals){

if(day>=r.start && day<=r.end){

let items=[]
try{items=JSON.parse(r.items)}catch{}

if(items.includes(ski.id)){
found=r
}

}

}

if(found){

html+=`<td class="booked" onclick="showBooking('${found.id}')">X</td>`

}else{

html+=`<td class="free">Ledig</td>`

}

})

html+="</tr>"

})

html+="</table>"

div.innerHTML=html

}
