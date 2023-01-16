//Usando D3 se selecciona el elemento graf de la página y se guarda en una constante.
const graf = d3.select("#graf")
const grafBarras = d3.select("#grafBarras")
const tooltip = d3.select("#tooltip")
const ePais = d3.select("#pais")
const eCasos = d3.select("#casos")
const eMuertes = d3.select("#muertes")
const eMortalidad = d3.select("#mortalidad")
const btnAnimando = d3.select("#btnAnimando")

//Se definen los márgenes para el gráfico.
const margins = { left: 60, top: 20, right: 20, bottom: 50 }
//Se obtiene el tamaño de div llamado graf de acuerdo al tamaño de la ventana.
const anchoTotal = +graf.style("width").slice(0, -2)/1.1
//Se calcula un alto de acuerdo al anchoTotal
const altoTotal = (anchoTotal * 9) / 18
const ancho = anchoTotal - margins.left - margins.right
const alto = altoTotal - margins.top - margins.bottom

//Agregamos el elemento <svg> con D3 al elemento div llamado graf y actualizamos algunos atributos.
const svg = graf
  .append("svg")
  .attr("width", anchoTotal)
  .attr("height", altoTotal)
  .attr("class", "fig")

//Acomodamos el elemento <svg> y guardamos el grupo de objetos en una constante.
const g = svg
  .append("g")
  .attr("transform", `translate(${margins.left}, ${margins.top})`)

//Se agrega la región donde se mostrará el grupo de objetos, en esta caso será un rectángulo.
const clip = g
  .append("clipPath")
  .attr("id", "clip")
  .append("rect")
  .attr("width", ancho)
  .attr("height", alto)

//Se agrega la leyenda del año al grupo y se ajuste según el tamaño de la ventana.
const eMes = g
  .append("text")
  .attr("x", ancho / 3.2)
  .attr("y", alto / 7)
  .attr("font-size", ancho / 12)
  .attr("class", "consecutivoMes")

g.append("rect")
  .attr("x", "0")
  .attr("y", "0")
  .attr("width", ancho)
  .attr("height", alto)
  .attr("class", "grupo")

//Se definen los rangos para las escalas.
const x = d3.scaleLog().range([40, ancho-40]).nice()
const y = d3.scaleLog().range([alto-40, 0])
const A = d3.scaleSqrt().range([2, 100]).clamp(true)
//Se guarda un arreglo de colores para los continentes.
const continent = d3.scaleOrdinal().range(d3.schemeSet2)

//Se define el origen de las líneas guía.
const xAxis = d3.axisBottom(x).tickSize(-alto)
const yAxis = d3.axisLeft(y).tickSize(-ancho)

let mesConsecutivo, maxMes, minMes
let auxMes, nomMes, auxYear
let animando = false
let intervalo

//Variables para el gráfico de barras.
var dataBarras, dataOrden
var auxDataOrden = new Array(10) 
//let showT = undefined

//------------------------------------------------
//Inicio de gráfico de Barras
//Se definen los márgenes para el gráfico.
const marginsBar = { left: 85, top: 20, right: 45, bottom: 50 }
//const marginsBar = { left: 100, top: 20, right: 60, bottom: 50 }
//Se obtiene el tamaño de div llamado graf de acuerdo al tamaño de la ventana.
const anchoTotalBar = +graf.style("width").slice(0, -2)/1.1
//Se calcula un alto de acuerdo al anchoTotal
const altoTotalBar = (anchoTotal * 9) / 18
const anchoBar = anchoTotalBar - marginsBar.left - marginsBar.right
const altoBar = altoTotalBar - marginsBar.top - marginsBar.bottom

const svgBarras = grafBarras
  .append("svg")
  .attr("width", anchoTotalBar)
  .attr("height", altoTotalBar*2)
  .attr("class", "fig")

const fondo = svgBarras
  .append("g")
  .attr("transform", `translate(${marginsBar.left}, ${marginsBar.top})`)

fondo
  .append("rect")
  .attr("x", "0")
  .attr("y", "0")
  .attr("width", anchoBar)
  .attr("height", altoBar)
  .attr("class", "grupo")

const gMuertes = svgBarras
  .append("g")
  .attr("transform", `translate(${marginsBar.left}, ${marginsBar.top})`)

const a = svgBarras
  .append("g")
  .attr("transform", `translate(${marginsBar.left}, ${marginsBar.top})`)
//Fin de construcción gráfico de barras.
//----------------------------------------------------------------

const load = async () => {
  //Cargamos y guardamos los registros del archivo CSV.
  data = await d3.csv("data/covid_data.csv", d3.autoType)
  dataBar = data
  //Dejamos solo registros en los que hubo muertes.
  data = d3.filter(data, (d) => (d.casos) > 0 && (d.mortalidad) > 0)
  //Se definen los valores mínimo y máximo para el dominio de la escala.
  x.domain(d3.extent(data, (d) => d.casos))
  y.domain(d3.extent(data, (d) => d.mortalidad))
  A.domain(d3.extent(data, (d) => d.muertes))  

  continent.domain(Array.from(new Set(data.map((d) => d.continente))))

  minMes = d3.min(data, (d) => d.consecutivo_mes)
  maxMes = d3.max(data, (d) => d.consecutivo_mes)

  auxYear = d3.min(data, (d) => d.year)
  
  mesConsecutivo = minMes  
  auxMes = ""
  auxMes = mesConsecutivo + " (ene " + auxYear + ")"

//Eje de las Y
  g.append("g")
    .attr("transform", `translate(0, ${alto})`)
    .attr("class", "ejes")
    .call(xAxis)
    .attr("font-size", alto/26+"px")

//Eje de las X
  g.append("g")
    .attr("class", "ejes")
    .call(yAxis)
    .attr("font-size", alto/26+"px")

  g.append("text")
    .attr("x", ancho / 2)
    .attr("y", alto + 40+"px")
    .attr("text-anchor", "middle")
    .attr("class", "labels")
    .attr("font-size", alto/15+"px")
    .text("Casos")

  g.append("g")
    .attr("transform", `translate(0, ${alto / 2})`)
    .append("text")
    .attr("y", -35)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .attr("class", "labels")
    .attr("font-size", alto/15+"px")
    .text("Tasa de mortalidad %")

  render(data)
  loadBarras(dataBar)
}

const render = (data) => {
  //Creamos un nuevo dataset solo con los datos del consecutivo_mes igual a 1.
  let newData = d3.filter(data, (d) => d.consecutivo_mes == mesConsecutivo)

  // Join-Enter-Update-Exit
  //Agregamos un circulo para cada país del nuevo dataset.
  const circle = g.selectAll("circle").data(newData, (d) => d.pais)

  circle
    .enter()
    .append("circle")
    .attr("cx", (d) => x(d.casos))
    .attr("cy", (d) => y(d.mortalidad))
    .attr("r", 0)
    .attr("fill", "#00ff0088")
    .attr("clip-path", "url(#clip)")
    .attr("stroke", "#00000088")
    .on("mouseover", (e, d) => showTooltip(d))
    .on("mouseout", (e, d) => hideTooltip())
    .merge(circle)
    .transition()
    .duration(500)
    .attr("cx", (d) => x(d.casos))
    .attr("cy", (d) => y(d.mortalidad))
    .attr("r", (d) => A(d.muertes))
    .attr("fill", (d) => continent(d.continente) + "88")

  circle
    .exit()
    .transition()
    .duration(500)
    .attr("r", 0)
    .attr("fill", "#ff000088")
    .remove()

  eMes.text(auxMes)
}

const delta = (d) => {
  mesConsecutivo += d
  if (mesConsecutivo > maxMes) mesConsecutivo = maxMes
  if (mesConsecutivo < minMes) mesConsecutivo = minMes

  datum = data.filter((d) => d.consecutivo_mes == mesConsecutivo)[0]
  auxMes = mesConsecutivo + " (" + datum.mes + " " + datum.year + ")"
  tooltip
    .style("left", x(datum.casos) - A(datum.muertes) + "px")
    .style("top", y(datum.mortalidad) - A(datum.muertes) + "px")
  ePais.text(datum.pais)
  eCasos.text(datum.casos.toLocaleString('en'))
  eMuertes.text(datum.muertes.toLocaleString('en'))
  eMortalidad.text(datum.mortalidad + "%")
  
  render(data)
  auxMes=""
}

const showTooltip = (d) => {
  tooltip.style("display", "block")
  tooltip
    .style("left", x(d.casos) - A(d.muertes)+ "px")
    .style("top", y(d.mortalidad) - A(d.muertes)+ "px")

  var span = tooltip.selectAll("span#muertes")
  span.style("color", "yellow")
      .style("font-weight", "bold")

  ePais.text(d.pais)
  eCasos.text(d.casos.toLocaleString('en'))
  eMuertes.text(d.muertes.toLocaleString('en'))
  eMortalidad.text(d.mortalidad + "%")
  showT = d.pais
}

const hideTooltip = () => {
  tooltip.style("display", "none")
}

let i = 1;
const toggleAnimando = () => {
  if(i>=maxMes){
    mesConsecutivo = minMes
    auxMes = ""
    auxMes = mesConsecutivo + " (ene " + auxYear + ")"
    delta(i-maxMes-1)
    i=1
  }

  animando = !animando
  if (animando) {
    btnAnimando.classed("btn-outline-secondary", false)
    btnAnimando.classed("btn-outline-danger", true)
    btnAnimando.html("<i class='fas fa-stop fa-lg'></i>")

    intervalo = setInterval(() => {
      if(i<=maxMes){
        delta(1);
        i+=1;
      }else{
        btnAnimando.classed("btn-outline-secondary", true)
        btnAnimando.classed("btn-outline-danger", false)
        btnAnimando.html("<i class='fas fa fa-backward fa-lg'></i>")
        clearInterval(intervalo)
      }
    }, 400)
  } else {
    btnAnimando.classed("btn-outline-secondary", true)
    btnAnimando.classed("btn-outline-danger", false)
    btnAnimando.html("<i class='fas fa-play fa-lg'></i>")
    clearInterval(intervalo)
  }
}


//----------------------------------------------------------------
//Gárfico de barras
const loadBarras = (data) => {
  dataBarras = Array.from(d3.rollup(data, v => d3.sum(v, d => d.muertes), d => d.pais))
  
  dataOrden = dataBarras.sort(function(a, b) {
    return b[1] - a[1];
  }).slice(0,10);

  var datos = []

  for(var j= 0; j < dataOrden.length; j++) {    
    datos.push(JSON.parse(JSON.stringify({ pais: dataOrden[j][0], muertes: dataOrden[j][1] })))
  }

  //console.log(d3.map(datos, (d) => d.pais))
  //console.log(d3.map(datos, (d) => d.muertes))
  //console.log(datos[0].muertes);

  for(var i=0; i<dataOrden.length; i++) {
    auxDataOrden[i] = dataOrden[i][1];
  }

  const yb = d3.scaleLog().range([altoBar,0])
  //console.log(d3.extent(datos, (d) => d.muertes))
  //yb.domain([140000, Math.max(...auxDataOrden)]).nice();
  yb.domain(d3.extent(datos, (d) => d.muertes)).nice()

  /*
  const yb = d3
            .scaleLog()
            .domain([Math.min(...auxDataOrden), Math.max(...auxDataOrden)])
            .range([altoBar, 0])
            .nice()
  */
            
  const xb = d3
            .scaleBand()
            .domain(d3.map(datos, (d) => d.pais))
            .range([0, anchoBar])
            //.paddingInner(0.2)
            .paddingOuter(0.2)     
            .align(0.5) 

  // Ejes
  const xAxisBarras = d3.axisBottom(xb)
  const xAxisGroup = a
    .append("g")
    .attr("class", "ejes")
    .attr("transform", `translate(0, ${altoBar})`)
    .call(xAxisBarras)
    .attr("font-size", altoBar/28+"px")   

  const yAxisBarras =  d3.axisLeft(yb).tickSize(-anchoBar)
  const yAxisGroup = a
    .append("g")
    .attr("class", "ejes")
    .call(yAxisBarras)
    .attr("font-size", altoBar/28+"px")

// Función Render
const renderBar = () => {
  const rectMuertes = gMuertes
    .selectAll("rect")
    .data(datos)
    .enter()
    .append("rect")
    .attr("x", (d) => xb(d.pais))
    //.attr("y", yb(140000))
    .attr("y", yb(Math.min(...auxDataOrden)))
    .attr("width", xb.bandwidth() / 1.1)
    .attr("height", 0)
    .attr("fill", "yellow")
    .transition()
    .duration(2000)
    .attr("fill", "blue")
    .attr("y", (d) => yb(d.muertes))
    .attr("height", (d) => altoBar - yb(d.muertes))

 const textoMuertes = gMuertes.selectAll("text")
    .data(datos)
    .enter()
    .append("text")
    .text((d) => Math.round((d.muertes)/1000) + "k")
    .attr("font-family", "sans-serif")
    .attr("font-size", "10px")
    .attr("x", function(d, i) {return (i * xb.bandwidth())+((xb.bandwidth()/1.4)/1.8)})
    .attr("y", (d) => yb(d.muertes)-5)
    .attr("font-family", "sans-serif")    
    .attr("font-size", altoBar/28+"px")
    .attr("fill", "red")
    .style("font-weight", "bold")
}

a.append("text")
.attr("x", anchoBar / 2)
.attr("y", altoBar + 50+"px")
.attr("text-anchor", "middle")
.attr("class", "labels")
.attr("font-size", altoBar/15+"px")
.text("País")

a.append("g")
.attr("transform", `translate(0, ${altoBar / 2})`)
.append("text")
.attr("y", -45)
.attr("transform", "rotate(-90)")
.attr("text-anchor", "middle")
.attr("class", "labels")
.attr("font-size", altoBar/15+"px")
.text("Total de muertes")

renderBar() 
}

load()
