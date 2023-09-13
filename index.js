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
              "diferencia": [] // Encuentra documentos que no tienen datos en la segunda colección
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

/* const getMedicamentosPro = async (req,res) = >{
  try {
    const collection = db.collection('')
  } catch (error) {
    console.log(error);
  }
}
 */
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

app.listen(3309)