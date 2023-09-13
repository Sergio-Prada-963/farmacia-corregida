const {MongoClient} = require('mongodb');
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
    const projection = { projection: { "proveedor.nombre": 1, "proveedor.contacto": 1, "_id": 0 } }; 
    const data = await collection.find({}, projection).toArray();
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

const getVParac = async (req,res)=>{
    const collection = db.collection('Ventas');
    const total = await collection.count({"medicamentosVendidos.nombreMedicamento": "Paracetamol"});
    const data = await collection.find({"medicamentosVendidos.nombreMedicamento": "Paracetamol"}).toArray();
    res.json({
        total: total,
        datos: [data]
    })
}

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
            totales[0] = totales[0] + e.medicamentosComprados[0].cantidadComprada;
        }
        if(e.proveedor.nombre == 'ProveedorB'){
            totales[1] = totales[1] + e.medicamentosComprados[0].cantidadComprada
        }
        else {totales[2] = totales[2] + e.medicamentosComprados[0].cantidadComprada}
    })
    const dataComprasP = [
        {proveedorA: totales[0]},
        {proveedorB: totales[1]},
        {proveedorC: totales[2]},
    ]
    //https://www.mongodb.com/docs/manual/reference/operator/aggregation/group/
    res.json({
        Contacto: dataComprasP
    })
}

//end points
app.get('/api/medicamentos/-50', get1Medicamentos50) /** 1 */
app.get('/api/proveedores', getProveedores) /** 2 */
app.get('/api/medicamentos/PrA', get3MedicamentosPrA) /** 3 */
app.get('/api/ventas/receta1Ene', get4Receta1) /** 4 */
app.get('/api/ventas/ventaParac', getVParac) /** 5 */
app.get('/api/medicamentos/Cad1', get6MedicamentosCad1) /** 6 */
app.get('/api/ventas/proveedores', getMedicamentosVproveedor) /** 7 */

app.listen(3309)