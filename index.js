const { MongoClient } = require("mongodb");
const express = require("express");
const app = express();

//base de datos mongo
const url = "mongodb+srv://alejandro:3691215@farmacia.6hzfsbz.mongodb.net/";
const client = new MongoClient(url);
const bdname = "test";
//Conexion
client.connect();
const db = client.db(bdname);
console.log("Conectado al la base de datos");

//consultas
const get1Medicamentos50 = async (req, res) => {
  const collection = db.collection("Medicamentos");
  const findResult = await collection.find({ stock: { $lt: 50 } }).toArray();
  res.json(findResult);
};

const getProveedores = async (req, res) => {
  const collection = db.collection("Medicamentos");
  //const projection = { projection: { "proveedor.nombre": 1, "proveedor.contacto": 1, "_id": 0 } };
  const data = await collection.distinct("proveedor");
  res.json(data);
};

const get3MedicamentosPrA = async (req, res) => {
  const collection = db.collection("Medicamentos");
  const findResult = await collection
    .find({ "proveedor.nombre": "ProveedorA" })
    .toArray();
  res.json(findResult);
};

const get4Receta1 = async (req, res) => {
  const collection = db.collection("Ventas");
  const fecha = new Date("2023-01-01");
  const findResult = await collection
    .find({ fechaVenta: { $gte: fecha } })
    .toArray();
  res.json(findResult);
};

const getVParac = async (req, res) => {
  try {
    const collection = db.collection("Ventas");
    const data = await collection
      .aggregate([
        {
          $unwind: "$medicamentosVendidos",
        },
        {
          $match: { "medicamentosVendidos.nombreMedicamento": "Paracetamol" },
        },
        {
          $group: {
            _id: null,
            ventas: {
              $sum: {
                $multiply: [
                  "$medicamentosVendidos.cantidadVendida",
                  "$medicamentosVendidos.precio",
                ],
              },
            },
          },
        },
      ])
      .toArray();
    res.json({ Medicamento: "paracetamol", totalVentas: data[0].ventas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errooooooor :(" });
  }
};

const get6MedicamentosCad1 = async (req, res) => {
  const collection = db.collection("Medicamentos");
  const fecha = new Date("2024-01-01");
  const data = await collection
    .find({ fechaExpiracion: { $gte: fecha } })
    .toArray();
  res.json(data);
};

const getMedicamentosVproveedor = async (req, res) => {
  const collection = db.collection("Compras");
  const data = await collection.find().toArray();
  let totales = [0, 0, 0];
  data.map((e) => {
    if (e.proveedor.nombre == "ProveedorA") {
      totales[0] += e.medicamentosComprados[0].cantidadComprada;
    }
    if (e.proveedor.nombre == "ProveedorB") {
      totales[1] += e.medicamentosComprados[0].cantidadComprada;
    } else {
      totales[2] += e.medicamentosComprados[0].cantidadComprada;
    }
  });
  const dataComprasP = [
    { proveedorA: totales[0] },
    { proveedorB: totales[1] },
    { proveedorC: totales[2] },
  ];
  res.json({
    CantidadVendida: dataComprasP,
  });
};

const getTotalMedicamentos = async (req, res) => {
  try {
    const collection = db.collection("Ventas");
    const data = await collection
      .aggregate([
        {
          $unwind: "$medicamentosVendidos", //desenvolver array
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$medicamentosVendidos.precio" },
          },
        },
      ])
      .toArray();
    res.json({ TotalVentas: data[0].total });
  } catch (error) {
    console.log(error);
  }
};

const getNoVendidos = async (req, res) => {
  try {
    const MedicamentosNo = db.collection("Medicamentos");
    const data = await MedicamentosNo.aggregate([
      {
        $lookup: {
          from: "Ventas",
          localField: "nombre",
          foreignField: "medicamentosVendidos.nombreMedicamento",
          as: "diferencia",
        },
      },
      {
        $match: {
          diferencia: [],
        },
      },
    ]).toArray();
    res.json({ medicamentosNovendidos: data });
  } catch (error) {
    console.log(error);
  }
};

const getMascaro = async (req, res) => {
  try {
    const collection = db.collection("Medicamentos");
    const data = await collection
      .aggregate([{ $sort: { precio: -1 } }, { $limit: 1 }])
      .toArray();
    res.json({ masCaro: data });
  } catch (error) {
    console.log(error);
  }
};

const getMedicamentosPro = async (req, res) => {
  try {
    const collection = db.collection("Medicamentos");
    const data = await collection.find().toArray();
    let totales = [0, 0, 0];
    data.map((e) => {
      if (e.proveedor.nombre == "ProveedorA") {
        totales[0]++;
      }
      if (e.proveedor.nombre == "ProveedorB") {
        totales[1]++;
      } else if (e.proveedor.nombre == "ProveedorC") {
        totales[2]++;
      }
    });
    const mediProvee = [
      { proveedorA: totales[0] },
      { proveedorB: totales[1] },
      { proveedorC: totales[2] },
    ];
    res.json({
      CantidadMedicamentos: mediProvee,
    });
  } catch (error) {
    console.log(error);
  }
};

const compraParacetamol = async (req, res) => {
  try {
    const collection = db.collection("Ventas");
    const data = await collection
      .aggregate([
        {
          $unwind: "$medicamentosVendidos", //desenvolver array
        },
        {
          $match: { "medicamentosVendidos.nombreMedicamento": "Paracetamol" }, // filtra
        },
      ])
      .toArray();
    res.json(data);
  } catch (error) {
    console.log(error);
  }
};

const getNoVendidoUltimoA = async (req, res) => {
  try {
    const collection = db.collection("Compras");
    const comprasM2023 = await collection
      .find({ fechaCompra: { $lt: new Date("2023-01-00T00:00:00.000+00:00") } })
      .toArray();
    res.json({ proveedoresNoVentas2023: comprasM2023 });
  } catch (error) {
    console.log(error);
  }
};

const getVendidoMarzo = async (req, res) => {
  try {
    const collection = db.collection("Ventas");
    const data = await collection
      .find({
        fechaVenta: {
          $gte: new Date("2023-03-01"),
          $lt: new Date("2023-04-01"),
        },
      })
      .toArray();
    res.json({ total: data.length, medicamentos: data });
  } catch (error) {
    console.log(error, "error :(");
  }
};

const getMenosV2023 = async (req, res) => {
  try {
    const collection = db.collection("Ventas");
    const data = await collection
      .find({
        fechaVenta: {
          $gte: new Date("2023-01-01"),
          $lt: new Date("2024-01-01"),
        },
      })
      .sort([["medicamentosVendidos.cantidadVendida", 1]])
      .limit(1)
      .toArray();
    res.json(data);
  } catch (error) {
    console.log(error);
  }
};

const allGananciaPro = async (req, res) => {
  try {
    const collection = db.collection("Compras");
    const data = await collection.find().toArray();
    let total = [0, 0, 0];
    data.map((e) => {
      if (e.proveedor.nombre == "ProveedorA") {
        total[0] =
          total[0] +
          e.medicamentosComprados[0].cantidadComprada *
            e.medicamentosComprados[0].precioCompra;
      }
      if (e.proveedor.nombre == "ProveedorB") {
        total[1] =
          total[1] +
          e.medicamentosComprados[0].cantidadComprada *
            e.medicamentosComprados[0].precioCompra;
      } else if (e.proveedor.nombre == "ProveedorC") {
        total[2] =
          total[2] +
          e.medicamentosComprados[0].cantidadComprada *
            e.medicamentosComprados[0].precioCompra;
      }
    });
    res.json({
      ganancias: [
        { ProveedorA: total[0] },
        { ProveedorB: total[1] },
        { ProveedorC: total[2] },
      ],
    });
  } catch (error) {
    console.log(error);
  }
};

const getPromedioMedicamentos = async (req, res) => {
  try {
    const collection = db.collection("Ventas");
    const data = await collection
      .aggregate([
        {
          $unwind: "$medicamentosVendidos",
        },
        {
          $group: {
            _id: 0,
            cantidad: {
              $sum: "$medicamentosVendidos.cantidadVendida",
            },
            price: {
              $sum: "$medicamentosVendidos.precio",
            },
          },
        },
        {
          $project: {
            _id: 0,
            promedioVentas: {
              $divide: ["$price", "$cantidad"],
            },
          },
        },
      ])
      .toArray();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errooooooor :(" });
  }
};

const ventasEmpleados = async (req, res) => {
  try {
    const collection = db.collection("Ventas");
    const data = await collection
      .aggregate([
        { $unwind: "$medicamentosVendidos" },
        {
          $group: {
            _id: "$empleado.nombre",
            nombre: { $first: "$empleado.nombre" },
            total: {
              $sum: "$medicamentosVendidos.cantidadVendida",
            },
          },
        },
      ])
      .toArray();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errooooooor :(" });
  }
};

const medicaExpira2024 = async (req, res) => {
  try {
    const collection = db.collection("Medicamentos");
    const data = await collection
      .find({ fechaExpiracion: { $gte: new Date("2024-01-01") } })
      .toArray();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errooooooor :(" });
  }
};

const mas5Ventas = async (req, res) => {
  try {
    const collection = db.collection("Ventas");
    const data = await collection
      .aggregate([
        { $unwind: "$medicamentosVendidos" },
        {
          $group: {
            _id: "$empleado.nombre",
            total: {
              $sum: "$medicamentosVendidos.cantidadVendida",
            },
          },
        },
      ])
      .toArray();
    const data2 = [];
    data.map((e) => {
      if (e.total > 5) {
        data2.push({ empleado: e._id, Ventas: e.total });
      }
    });
    res.json(data2);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errooooooor :(" });
  }
};
const medicaNuncaVen = async (req, res) => {
  try {
    const collection = db.collection("Medicamentos");
    const data = await collection
      .aggregate([
        {
          $lookup: {
            from: "Ventas",
            localField: "nombre",
            foreignField: "medicamentosVendidos.nombreMedicamento",
            as: "noVendidos",
          },
        },
        {
          $match: { noVendidos: [] },
        },
      ])
      .toArray();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errooooooor :(" });
  }
};

const pacienteGastaMas = async (req, res) => {
  try {
    const collection = db.collection("Ventas");
    const data = await collection
      .aggregate([
        { $unwind: "$medicamentosVendidos" },
        {
          $match: {
            fechaVenta: {
              $gte: new Date("2023-01-01"),
              $lt: new Date("2024-01-01"),
            },
          },
        },
        {
          $group: {
            _id: "$paciente.nombre",
            total: {
              $sum: {
                $multiply: [
                  "$medicamentosVendidos.cantidadVendida",
                  "$medicamentosVendidos.precio",
                ], // multiplica
              },
            },
          },
        },
        { $sort: { total: -1 } },
      ])
      .limit(1)
      .toArray();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errooooooor :(" });
  }
};

const empleadosNingunaVen = async (req, res) => {
  try {
    const collection = db.collection("Empleados");
    const data = await collection
      .aggregate([
        {
          $lookup: {
            from: "Ventas",
            localField: "nombre",
            foreignField: "empleado.nombre",
            as: "ventas",
          },
        },
        {
          $match: { ventas: [] },
        },
      ])
      .toArray();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errooooooor :(" });
  }
};

const proveeMas = async (req, res) => {
  try {
    const collection = db.collection("Proveedores");
    const data = await collection
      .aggregate([
        {
          $lookup: {
            from: "Compras",
            localField: "nombre",
            foreignField: "proveedor.nombre",
            as: "provee",
          },
        },
        {
          $unwind: "$provee",
        },
        {
          $unwind: "$provee.medicamentosComprados",
        },
        {
          $match: {
            "provee.fechaCompra": {
              $gte: new Date("2023-01-01"),
              $lt: new Date("2024-01-01"),
            },
          },
        },
        {
          $group: {
            _id: "$_id",
            nombre: { $first: "$nombre" },
            direccion: { $first: "$direccion" },
            totalCantidadComprada: {
              $sum: "$provee.medicamentosComprados.cantidadComprada",
            },
          },
        },
        {
          $sort: { totalCantidadComprada: -1 },
        },
      ])
      .limit(1)
      .toArray();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errooooooor :(" });
  }
};

const compraParacetamol2023 = async (req, res) => {
  try {
    const collection = db.collection("Ventas");
    const data = await collection
      .aggregate([
        {
          $unwind: "$medicamentosVendidos",
        },
        {
          $match: {
            fechaVenta: {
              $gte: new Date("2023-01-01"),
              $lt: new Date("2024-01-01"),
            },
          },
        },
        {
          $match: { "medicamentosVendidos.nombreMedicamento": "Paracetamol" }, // filtra
        },
      ])
      .toArray();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errooooooor :(" });
  }
};

const ventaMedicMes = async (req, res) => {
  try {
    const collection = db.collection("Ventas");
    const data = await collection
      .aggregate([
        {
          $project: {
            mesVenta: { $month: "$fechaVenta" },
          },
        },
        {
          $group: {
            _id: "$mesVenta",
            totalVentas: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ])
      .toArray();
    res.json(data);
  } catch (error) {}
};

const empleMenos5V = async (req, res) => {
  try {
    const collection = db.collection("Empleados");
    const data = await collection
      .aggregate([
        {
          $lookup: {
            from: "Ventas",
            localField: "nombre",
            foreignField: "empleado.nombre",
            as: "ventas",
          },
        },
        {
          $project: {
            nombre: 1,
            cantidadVentas: { $size: "$ventas" },
          },
        },
        {
          $match: {
            cantidadVentas: { $lt: 5 },
          },
        },
      ])
      .toArray();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errooooooor :(" });
  }
};

const cantidadproveedores = async (req, res) => {
  try {
    const collection = db.collection("Medicamentos");
    const data = await collection.distinct("proveedor.nombre");
    res.json({ TotalProveedores: data.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errooooooor :(" });
  }
};

//////////////////////////////////////
const getMedicamentosMenos50 = async (req, res) => {
  try {
    const collection = db.collection("Medicamentos");
    const data = await collection
      .aggregate([
        {
          $match: {
            stock: { $lt: 50 },
          },
        },
        {
          $group: {
            _id: "$proveedor.nombre",
          },
        },
        {
          $project: {
            _id: 0,
            nombreProveedor: "$_id",
          },
        },
      ])
      .toArray();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errooooooor :(" });
  }
};

const getPacienteNuncaCompro2023 = async (req, res) => {
  try {
    const collection = db.collection("Pacientes");
    const data = await collection
      .aggregate([
        {
          $lookup: {
            from: "Ventas",
            localField: "nombre",
            foreignField: "paciente.nombre",
            as: "ventas",
          },
        },
        {
          $match: {
            ventas: { $size: 0 },
          },
        },
      ])
      .toArray();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errooooooor :(" });
  }
};

const getMedicamentosMes = async (req, res) => {
  try {
    const coleccion = db.collection("Ventas");
    const Resultado = await coleccion
      .aggregate([
        {
          $project: {
            mesVenta: { $month: "$fechaVenta" },
          },
        },
        {
          $group: {
            _id: "$mesVenta",
            totalVentas: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            mes: "$_id",
            totalVentas: 1,
          },
        },
        {
          $sort: { mes: 1 },
        },
      ])
      .toArray();
    res.json(Resultado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errooooooor :(" });
  }
};

const getEmpleadoMayorCantidad = async (req, res) => {
  try {
    const coleccion = db.collection("Ventas");
    const Resultado = await coleccion
      .aggregate([
        {
          $match: {
            fechaVenta: {
              $gte: new Date("2023-01-01T00:00:00.000Z"),
              $lt: new Date("2024-01-01T00:00:00.000Z"),
            },
          },
        },
        {
          $unwind: "$medicamentosVendidos",
        },
        {
          $group: {
            _id: {
              empleado: "$empleado.nombre",
              medicamento: "$medicamentosVendidos.nombreMedicamento",
            },
          },
        },
        {
          $group: {
            _id: "$_id.empleado",
            totalMedicamentos: { $sum: 1 },
          },
        },
        {
          $sort: { totalMedicamentos: -1 },
        },
        {
          $limit: 1,
        },
        {
          $project: {
            _id: 0,
            empleado: "$_id",
            totalMedicamentos: 1,
          },
        },
      ])
      .toArray();
    res.json(Resultado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errooooooor :(" });
  }
};

const getTotalGastosPaciente = async (req, res) => {
  try {
    const coleccion = db.collection("Ventas");
    const Resultado = await coleccion
      .aggregate([
        {
          $project: {
            mesVenta: { $month: "$fechaVenta" },
          },
        },
        {
          $group: {
            _id: "$mesVenta",
            totalVentas: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ])
      .toArray();
    res.json(Resultado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errooooooor :(" });
  }
};

const getmedicaNuncaVendido2023 = async (req, res) => {
  try {
    const collection = db.collection("Medicamentos");
    const data = await collection
      .aggregate([
        {
          $lookup: {
            from: "Ventas",
            localField: "nombre",
            foreignField: "medicamentosVendidos.nombreMedicamento",
            as: "ventas",
          },
        },
        {
          $match: {
            ventas: { $eq: [] },
            fechaVenta: {
              $gte: new Date("2023-01-01T00:00:00.000Z"),
              $lt: new Date("2023-04-01T00:00:00.000Z"),
            },
          },
        },
      ])
      .toArray();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errooooooor :(" });
  }
};

const getProveedoresMasCinco = async (req, res) => {
  try {
    const collection = db.collection("Compras");
    const data = await collection
      .aggregate([
        {
          $match: {
            fechaCompra: {
              $gte: new Date("2023-01-01T00:00:00.000Z"),
              $lt: new Date("2024-01-01T00:00:00.000Z"),
            },
          },
        },
        {
          $unwind: "$medicamentosComprados",
        },
        {
          $group: {
            _id: {
              proveedor: "$proveedor.nombre",
              producto: "$medicamentosComprados.nombreMedicamento",
            },
          },
        },
        {
          $group: {
            _id: "$_id.proveedor",
            totalProductos: { $sum: 1 },
          },
        },
        {
          $match: {
            totalProductos: { $gte: 5 },
          },
        },
        {
          $project: {
            _id: 0,
            proveedor: "$_id",
          },
        },
      ])
      .toArray();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "f" });
  }
};

const getMedicamentosTrimestre = async (req, res) => {
  try {
    const collection = db.collection("Ventas");
    const data = await collection
      .aggregate([
        {
          $match: {
            fechaVenta: {
              $gte: new Date("2023-01-01T00:00:00.000Z"),
              $lt: new Date("2023-04-01T00:00:00.000Z"),
            },
          },
        },
        {
          $unwind: "$medicamentosVendidos",
        },
        {
          $group: {
            _id: null,
            totalMedicamentosTrimestre: {
              $sum: "$medicamentosVendidos.cantidadVendida",
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalMedicamentosTrimestre: 1,
          },
        },
      ])
      .toArray();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "f" });
  }
};

const getEmpleadosNoVentasAbril = async (req, res) => {
  try {
    const collection = db.collection("Empleados");
    const data = await collection
      .aggregate([
        {
          $lookup: {
            from: "Ventas",
            localField: "nombre",
            foreignField: "empleado.nombre",
            as: "ventas",
          },
        },
        {
          $addFields: {
            ventasEnAbril: {
              $filter: {
                input: "$ventas",
                as: "venta",
                cond: {
                  $and: [
                    {
                      $gte: [
                        "$$venta.fechaVenta",
                        new Date("2023-04-01T00:00:00.000Z"),
                      ],
                    },
                    {
                      $lt: [
                        "$$venta.fechaVenta",
                        new Date("2023-05-01T00:00:00.000Z"),
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
        {
          $match: {
            ventasEnAbril: { $size: 0 },
          },
        },
        {
          $project: {
            _id: 0,
            nombre: 1,
          },
        },
      ])
      .toArray();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "f" });
  }
};

const getMedicamentosStock = async (req, res) => {
  try {
    const coleccion = db.collection("Medicamentos");
    const Resultado = await coleccion
      .find({ precio: { $gt: 50 }, stock: { $lt: 100 } })
      .toArray();
    res.json(Resultado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errooooooor :(" });
  }
};

//end points
app.get("/api/medicamentos/-50", get1Medicamentos50); /** 1 */
app.get("/api/proveedores", getProveedores); /** 2 */
app.get("/api/medicamentos/PrA", get3MedicamentosPrA); /** 3 */
app.get("/api/ventas/receta1Ene", get4Receta1); /** 4 */
app.get("/api/ventas/ventaParac", getVParac); /** 5 */
app.get("/api/medicamentos/Cad1", get6MedicamentosCad1); /** 6 */
app.get("/api/ventas/proveedores", getMedicamentosVproveedor); /** 7 */
app.get("/api/ventas/total", getTotalMedicamentos); /** 8 */
app.get("/api/noVendidos", getNoVendidos); /** 9 */
app.get("/api/masCaro", getMascaro); /** 10 */
app.get("/api/medicamentosPro", getMedicamentosPro); /** 11 */
app.get("/api/pacientesParacetamol", compraParacetamol); /** 12 */
app.get("/api/NoVentasUltA", getNoVendidoUltimoA); /** 13 */
app.get("/api/total/marzo", getVendidoMarzo); /** 14 */
app.get("/api/menosVendido/2023", getMenosV2023); /** 15 */
app.get("/api/ganancia/proveedor", allGananciaPro); /** 16 */
app.get("/api/promedioCompra/venta", getPromedioMedicamentos); /** 17 */
app.get("/api/ventasEmpleado", ventasEmpleados); /** 18 */
app.get("/api/expira/2024", medicaExpira2024); /** 19 */
app.get("/api/empleados/mas5", mas5Ventas); /** 20 */
app.get("/api/medicamentos/nunca", medicaNuncaVen); /** 21 */
app.get("/api/pacinete/masGasta", pacienteGastaMas); /** 22 */
app.get("/api/empleados/noneVentas", empleadosNingunaVen); /** 23 */
app.get("/api/proveedor/masMedic", proveeMas); /** 24 */
app.get("/api/compras/paracetamol2023", compraParacetamol2023); /** 25 */
app.get("/api/ventas/medicaMes", ventaMedicMes); /** 26 */
app.get("/api/empleados/meno5V", empleMenos5V); /** 27 */
app.get("/api/proveedores/number", cantidadproveedores); /** 28 */
app.get("/api/medicamentosMenos50", getMedicamentosMenos50); /* 29 */
app.get("/api/pacienteNuncaCompro2023", getPacienteNuncaCompro2023); /* 30 */
app.get("/api/medicamentosMes", getMedicamentosMes); /* 31 */
app.get("/api/empleadoMayorCantidad", getEmpleadoMayorCantidad); /* 32 */
app.get("/api/totalGastosPaciente", getTotalGastosPaciente); /* 33 */
app.get("/api/medicaNuncaVendido2023", getmedicaNuncaVendido2023); /* 34 */
app.get("/api/proveedoresMasCinco", getProveedoresMasCinco); /* 35 */
app.get("/api/medicamentosTrimestre", getMedicamentosTrimestre); /* 36 */
app.get("/api/empleadosNoVentasAbril", getEmpleadosNoVentasAbril); /* 37 */
app.get("/api/medicamentosStock", getMedicamentosStock); /* 38 */

app.listen(3308);