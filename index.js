const {MongoClient, Collection} = require('mongodb');
const express = require('express')
const app = express()

//base de datos mongo
const url = 'mongodb+srv://alejandro:3691215@farmacia.6hzfsbz.mongodb.net/'
const client = new MongoClient(url);
const bdname = "test";
//Conexion
client.connect();
const db = client.db(bdname);
console.log("Conectado al la base de datos");

//consultas
const get1Medicamentos50 = async (req,res)=>{
    const collection = db.collection('Medicamentos');
    const findResult = await collection.find({stock:{$lt: 50}}).toArray();
    res.json(findResult)
};

const getProveedores = async (req,res)=>{
    const collection = db.collection('Medicamentos');
    //const projection = { projection: { "proveedor.nombre": 1, "proveedor.contacto": 1, "_id": 0 } }; 
    const data = await collection.distinct("proveedor");
    res.json(data)
}

const get3MedicamentosPrA = async (req,res)=>{
    const collection = db.collection('Medicamentos');
    const findResult = await collection.find({"proveedor.nombre": "ProveedorA"}).toArray();
    res.json(findResult)
}

const get4Receta1 = async (req,res)=>{
    const collection = db.collection('Ventas');
    const fecha = new Date("2023-01-01");
    const findResult = await collection.find({fechaVenta:{$gte: fecha}}).toArray();
    res.json(findResult)
}

const getVParac = async (req, res) => {
    try {
      const collection = db.collection('Ventas');
      const data = await collection.aggregate([
        {
          $unwind: "$medicamentosVendidos" //desenvolver array
        },
        {
          $match: { "medicamentosVendidos.nombreMedicamento": "Paracetamol" } // filtra
        },
        {
          $group: {
            _id: null,
            ventas: {
              $sum: {
                $multiply: ["$medicamentosVendidos.cantidadVendida", "$medicamentosVendidos.precio"] // multiplica
              }
            }
          }
        }
      ]).toArray();
      res.json({ Medicamento: 'paracetamol', totalVentas: data[0].ventas});
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Errooooooor :(" });
    }
  };
  

const get6MedicamentosCad1 = async (req,res)=>{
    const collection = db.collection('Medicamentos');
    const fecha = new Date("2024-01-01");
    const data = await collection.find({fechaExpiracion:{$gte: fecha}}).toArray()
    res.json(data)
}

const getMedicamentosVproveedor = async (req,res)=>{
    const collection = db.collection('Compras');
    const data = await collection.find().toArray();
    let totales = [0,0,0]
    data.map((e)=>{
        if(e.proveedor.nombre == 'ProveedorA'){
            totales[0] += e.medicamentosComprados[0].cantidadComprada;
        }
        if(e.proveedor.nombre == 'ProveedorB'){
            totales[1] += e.medicamentosComprados[0].cantidadComprada
        }
        else {totales[2] += e.medicamentosComprados[0].cantidadComprada}
    })
    const dataComprasP = [
        {proveedorA: totales[0]},
        {proveedorB: totales[1]},
        {proveedorC: totales[2]},
    ]
    //https://www.mongodb.com/docs/manual/reference/operator/aggregation/group/
    //https://www.mongodb.com/docs/v7.0/reference/method/
    res.json({
        CantidadVendida: dataComprasP
    })
}

/* const getMedicamentosVproveedor = async (req,res)=>{
    const collection = db.collection('Compras');
    const proveedores = ["ProveedorA", "ProveedorB", "ProveedorC"];
    const data = await collection.aggregate([
        {
          $unwind: "$medicamentosComprados" //desenvolver array
        },
        {
          $match: { "proveedor.nombre": {$in:proveedores}} // filtra
        },
        {
            $group: {
              _id: "$medicamentosComprados.nombreMedicamento",
              totalCantidadComprada: { $sum: "medicamentosComprados.cantidadComprada" }
            }
        }
      ]).toArray();
      console.log(data);
    res.json(data)
} */

const getTotalMedicamentos = async(req,res)=>{
  try {
    const collection = db.collection('Ventas');
    const data = await collection.aggregate(
      [
        {
          $unwind: "$medicamentosVendidos" //desenvolver array
        },
        {
          $group:{
            _id: null,
            total: {$sum: "$medicamentosVendidos.precio"},
          }
        }
      ]
    ).toArray()
    res.json({TotalVentas: data[0].total})
  } catch (error) {
    console.log(error);
  }
}

const getNoVendidos = async(req,res)=>{
  try {
    const MedicamentosNo = db.collection('Medicamentos')
    const data = await MedicamentosNo.aggregate([
      {
        $lookup:{
          from: 'Ventas',
          localField: "nombre",
          foreignField: "medicamentosVendidos.nombreMedicamento",
          as: "diferencia"
        }
      },
      {
          $match: {
              "diferencia": [] // filtra los que no tienen en comun
          }
      }
    ]).toArray()
    res.json({medicamentosNovendidos: data})
  } catch (error) {
    console.log(error);
  }
}

const getMascaro = async(req,res)=>{
  try {
    const collection = db.collection('Medicamentos')
    const data = await collection.aggregate([{$sort: {"precio": -1}},{$limit: 1}]).toArray()
    res.json({masCaro:data})
  } catch (error) {
    console.log(error);
  }
}

const getMedicamentosPro = async (req,res) => {
  try {
    const collection = db.collection('Medicamentos')
    const data = await collection.find().toArray();
    let totales = [0,0,0]
    data.map((e)=>{
        if(e.proveedor.nombre == 'ProveedorA'){
            totales[0]++;
        }
        if(e.proveedor.nombre == 'ProveedorB'){
            totales[1]++
        }
        else if(e.proveedor.nombre == 'ProveedorC'){totales[2]++}
})
    const mediProvee = [
        {proveedorA: totales[0]},
        {proveedorB: totales[1]},
        {proveedorC: totales[2]},
    ]
    //https://www.mongodb.com/docs/manual/reference/operator/aggregation/group/
    //https://www.mongodb.com/docs/v7.0/reference/method/
    res.json({
        CantidadMedicamentos: mediProvee
    })  
  } catch (error) {
    console.log(error);
  }
}

const compraParacetamol = async (req,res)=>{
  try {
    const collection = db.collection('Ventas');
    const data = await collection.aggregate([
      {
        $unwind: "$medicamentosVendidos" //desenvolver array
      },
      {
        $match: { "medicamentosVendidos.nombreMedicamento": "Paracetamol" } // filtra
      }
    ]).toArray();
    res.json(data)
  } catch (error) {
    console.log(error);
  }
}

const getNoVendidoUltimoA = async (req, res) => {
  try {
    const collection = db.collection('Compras');
    const comprasM2023 = await collection.find({fechaCompra:{$lt: new Date("2023-01-00T00:00:00.000+00:00")}}).toArray();
    res.json({proveedoresNoVentas2023:comprasM2023})
  } catch (error) {
    console.log(error);
  }
}

const getVendidoMarzo = async (req,res) =>{
  try {
    const collection = db.collection('Ventas');
    const data = await collection.find({fechaVenta: {$gte: new Date('2023-03-01'), $lt: new Date('2023-04-01')}}).toArray()
    res.json({total: data.length, medicamentos: data})
  } catch (error) {
    console.log(error,"error :(");
  }
}

const getMenosV2023 = async (req,res)=>{
  try {
    const collection = db.collection('Ventas');
    const data = await collection.find({fechaVenta: {$gte: new Date('2023-01-01'), $lt: new Date('2024-01-01')}}).sort([["medicamentosVendidos.cantidadVendida", 1]]).limit(1).toArray();
    res.json(data)
  } catch (error) {
    console.log(error);
  }
}

const allGananciaPro = async (req,res)=>{
  try {
    const collection = db.collection('Compras');
    const data = await collection.find().toArray();
    let total = [0, 0, 0]
    data.map((e)=>{
      if(e.proveedor.nombre == 'ProveedorA'){
        total[0] = total[0]+(e.medicamentosComprados[0].cantidadComprada*e.medicamentosComprados[0].precioCompra);
      }
      if(e.proveedor.nombre == 'ProveedorB'){
        total[1] = total[1]+(e.medicamentosComprados[0].cantidadComprada*e.medicamentosComprados[0].precioCompra);
      }
      else if(e.proveedor.nombre == 'ProveedorC'){
        total[2] = total[2]+(e.medicamentosComprados[0].cantidadComprada*e.medicamentosComprados[0].precioCompra);
      }
    })
    res.json({"ganancias": [{"ProveedorA":total[0]},{"ProveedorB":total[1]},{"ProveedorC":total[2]}]});
  } catch (error) {
    console.log(error);
  }
}


/* const getPromedioMedicamentos = async(req , res ) => {
  try {
      const collection = db.collection('Ventas')
      const data = await collection.aggregate([ 
        {$project: {medicamentosVendidos: 1, _id: 0}},
        {$group: {
            _id: null,
            total: {$sum: "medicamentosVendidos.cantidadVendida"}
          }
        }
      ]).toArray()
      //const medicamentoPrecio = precioMedicamentosData.map((e)=>{
      //    return (e.medicamentosVendidos).map((e)=> e.precio)
      //}).flat(Infinity);
      //const medicamentosPromedioo = medicamentoPrecio.reduce((a , b)=> a + b, 0 ) / medicamentoPrecio.length;
      //res.json({
      //    Precio_promedio: medicamentosPromedioo
      //})
      res.json(data)
  } catch (error) {
      console.log(error);
  }
};
 */

const getPromedioMedicamentos = async (req, res) => {
  try {
    const collection = db.collection('Ventas');
    const data = await collection.aggregate([
      {
        $unwind: "$medicamentosVendidos"
      },
      {
        $group: {
          _id: 0,
          cantidad: {
            $sum: "$medicamentosVendidos.cantidadVendida"
          },
          price: {
            $sum: "$medicamentosVendidos.precio"
          }
        }
      },
      {
        $project: {
          _id: 0,
          promedioVentas: {
            $divide: ["$price","$cantidad" ]
          }
        }
      }
    ]).toArray();
    res.json(data)
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errooooooor :(" });
  }
};

const ventasEmpleados = async (req,res)=>{
  try {
    const collection = db.collection('Ventas')
    const data = await collection.aggregate([
      {$unwind: "$medicamentosVendidos"},
      {
        $group:{
          _id: "$empleado.nombre",
          total: {
            $sum: "$medicamentosVendidos.cantidadVendida"
          }
        }
      }
    ]).toArray();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errooooooor :(" });
  }
}

const medicaExpira2024 = async (req,res)=>{
  try {
    const collection = db.collection('Medicamentos');
    const data = await collection.find({fechaExpiracion: {$gte: new Date('2024-01-01')}}).toArray()
    res.json(data)
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errooooooor :(" });
  }
}

const mas5Ventas = async (req,res)=>{
  try {
    const collection = db.collection('Ventas')
    const data = await collection.aggregate([
      {$unwind: "$medicamentosVendidos"},
      {
        $group:{
          _id: "$empleado.nombre",
          total: {
            $sum: "$medicamentosVendidos.cantidadVendida"
          }
        }
      }
    ]).toArray();
    const data2 = []
    data.map(e=>{
      if(e.total > 5){
        data2.push({"empleado": e._id, "Ventas": e.total})
      }

    })
    res.json(data2);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errooooooor :(" });
  }
}
 
//end points
app.get('/api/medicamentos/-50', get1Medicamentos50) /** 1 */
app.get('/api/proveedores', getProveedores) /** 2 */
app.get('/api/medicamentos/PrA', get3MedicamentosPrA) /** 3 */
app.get('/api/ventas/receta1Ene', get4Receta1) /** 4 */
app.get('/api/ventas/ventaParac', getVParac) /** 5 */
app.get('/api/medicamentos/Cad1', get6MedicamentosCad1) /** 6 */
app.get('/api/ventas/proveedores', getMedicamentosVproveedor) /** 7 */
app.get('/api/ventas/total', getTotalMedicamentos) /** 8 */
app.get('/api/noVendidos', getNoVendidos) /** 9 */
app.get('/api/masCaro', getMascaro) /** 10 */
app.get('/api/medicamentosPro', getMedicamentosPro) /** 11 */
app.get('/api/pacientesParacetamol', compraParacetamol) /** 12 */
app.get('/api/NoVentasUltA', getNoVendidoUltimoA) /** 13 */
app.get('/api/total/marzo', getVendidoMarzo) /** 14 */
app.get('/api/menosVendido/2023', getMenosV2023) /** 15 */
app.get('/api/ganancia/proveedor', allGananciaPro) /** 16 */ 
app.get('/api/promedioCompra/venta', getPromedioMedicamentos) /** 17 */ 
app.get('/api/ventasEmpleado', ventasEmpleados) /** 18 */ 
app.get('/api/expira/2024', medicaExpira2024) /** 19 */ 
app.get('/api/empleados/mas5', mas5Ventas) /** 20 */ 

app.listen(3309)


// vuelvo en 5 min
// vuelvo en 5 min
// vuelvo en 5 min
// vuelvo en 5 min
// vuelvo en 5 min
// vuelvo en 5 min
// vuelvo en 5 min
// vuelvo en 5 min
// vuelvo en 5 min
// vuelvo en 5 min
// vuelvo en 5 min
// vuelvo en 5 min
// vuelvo en 5 min
// vuelvo en 5 min
// vuelvo en 5 min
// vuelvo en 5 min
// vuelvo en 5 min
// vuelvo en 5 min
// vuelvo en 5 min
// vuelvo en 5 min
// vuelvo en 5 min
// vuelvo en 5 min
// vuelvo en 5 min
// vuelvo en 5 min
// vuelvo en 5 min
// vuelvo en 5 min
// vuelvo en 5 min
// vuelvo en 5 min
// vuelvo en 5 min
// vuelvo en 5 min