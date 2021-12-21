/* -------------------------------------------------- */
/* Modules */

const fs = require('fs')
const express = require('express')
const { Console } = require('console')
const { Router } = express

/* -------------------------------------------------- */
/* Global Variables & Functions */

const productFile = './src/productList.txt'
let productList = []

const cartFile = './src/cartList.txt'
let cartList = []
// const cartList = [
//     {
//         "id": 1,
//         "timestamp": "11/13/2021, 10:05:58 PM",
//         "products": []
//     }
// ]

const administrator = true

const saveToFile = async (file, content) => {
    try {
        await fs.promises.writeFile(file, JSON.stringify(content, null, 2))
    } catch (error) {
        throw new Error(`Error en escritura: ${error.message}`)
    }
}

const fileToJSON = async (file) => {
    try {
        let content = await fs.promises.readFile(file, 'utf-8')
        return JSON.parse(content)
    } catch (error) {
        throw new Error(`Error en lectura: ${error.message}`)
    }
}

/* -------------------------------------------------- */
/* Initialization */

const app = express()
const routerStore = Router()
const routerCart = Router()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))
app.use('/api/productos', routerStore)
app.use('/api/carrito', routerCart)

/* -------------------------------------------------- */
/* Store Routing */

routerStore.get('/', async (req, res) => {
    productList = await fileToJSON(productFile)
    res.send(productList)
})

routerStore.get('/:id', async (req, res) => {
    productList = await fileToJSON(productFile)
    let { id } = req.params
    let found = productList.find( x => x.id === parseInt(id))
    if(found){
        res.json({ producto: found })
    } else {
        res.json({ error : 'producto no encontrado' })
    }
})

routerStore.post('/', async (req, res) => {
    if (administrator) {
        productList = await fileToJSON(productFile)

        let { title, price, thumbnail, description, code, stock } = req.body

        productList.push({
            title: title,
            price: price,
            thumbnail: thumbnail,
            id: productList.length + 1,
            timestamp: new Date().toLocaleString(),
            description: description,
            code: code,
            stock: stock
        })

        saveToFile(productFile, productList)

        res.json({ agregado: productList[productList.length - 1] })
    } else {
        res.json({ error: -1, descripcion: `ruta /api/productos/ método POST no autorizado` })
    }
})

routerStore.put('/:id', async (req, res) => {
    if (administrator) {
        productList = await fileToJSON(productFile)

        let { id } = req.params
        let { title, price, thumbnail, description, code, stock } = req.body
        let found = productList.find( x => x.id === parseInt(id))
        if (found) {
            let productIndex = productList.findIndex( x => x.id === parseInt(id))
            productList[productIndex].title = title
            productList[productIndex].price = price
            productList[productIndex].thumbnail = thumbnail
            productList[productIndex].timestamp = new Date().toLocaleString()
            productList[productIndex].description = description
            productList[productIndex].code = code
            productList[productIndex].stock = stock
            saveToFile(productFile, productList)
            res.json({ modificado: productList[productIndex] })
        } else {
            res.json({ error: 'producto no encontrado' })
        }
    } else {
        res.json({ error: -1, descripcion: `ruta /api/productos/ método PUT no autorizado` })
    }
})

routerStore.delete('/:id', async (req, res) => {
    if (administrator) {
        productList = await fileToJSON(productFile)
        let { id } = req.params
        let found = productList.find( x => x.id === parseInt(id))
        if (found) {
            let productIndex = productList.findIndex( x => x.id === parseInt(id))
            let toDelete = productList[productIndex]
            productList.splice(productIndex, 1)
            saveToFile(productFile, productList)
            res.send({ eliminado: toDelete })
        } else {
            res.json({ error: 'producto no encontrado' })
        }
    } else {
        res.json({ error: -1, descripcion: `ruta /api/productos/ método DELETE no autorizado` })
    }
})

/* -------------------------------------------------- */
/* Cart Routing */

routerCart.get('/', async (req, res) => {
    cartList = await fileToJSON(cartFile)
    res.send(cartList)
})

routerCart.post('/', async (req, res) => {
    cartList = await fileToJSON(cartFile)
    let newCartID
    if (cartList.length !== 0) {
        newCartID = cartList[cartList.length - 1].id + 1
    } else {
        newCartID = 1
    }

    cartList.push( {
        id: newCartID,
        timestamp: new Date().toLocaleString(),
        products: []
    })

    saveToFile(cartFile, cartList)

    res.send(cartList.find( x => x.id === newCartID))
})

routerCart.delete('/:id', async (req, res) => {
    cartList = await fileToJSON(cartFile)
    let { id } = req.params
    let found = cartList.find( x => x.id === parseInt(id))

    if (found) {
        let cartIndex = cartList.findIndex( x => x.id === parseInt(id))
        let toDelete = cartList[cartIndex]
        cartList.splice(cartIndex, 1)

        saveToFile(cartFile, cartList)

        res.send({ eliminado: toDelete })
    } else {
        res.json({ error: 'carrito no encontrado' })
    }
})

routerCart.get('/:id/productos', async (req, res) => {
    cartList = await fileToJSON(cartFile)
    let { id } = req.params
    let found = cartList.find( x => x.id === parseInt(id))

    if (found) {
        let cartIndex = cartList.findIndex( x => x.id === parseInt(id))
        res.send({ productos: cartList[cartIndex].products })
    } else {
        res.json({ error: 'carrito no encontrado' })
    }
})

routerCart.post('/:id/productos', async (req, res) => {
    cartList = await fileToJSON(cartFile)
    productList = await fileToJSON(productFile)
    let { id } = req.params
    let { id_prod } = req.body
    let foundCart = cartList.find( x => x.id === parseInt(id))
    let foundProduct = productList.find( x => x.id === parseInt(id_prod))

    if (foundCart && foundProduct) {
        let cartIndex = cartList.findIndex( x => x.id === parseInt(id))
        let productIndex = productList.findIndex( x => x.id === parseInt(id_prod))

        cartList[cartIndex].products.push({

            // Si el carrito seleccionado ya tiene productos, toma el id del último + 1; si no tiene, inicializa en 1
            id: productList[productIndex].id,
            timestamp: new Date().toLocaleString(),
            title: productList[productIndex].title,
            description: "",
            code: "",
            thumbnail: productList[productIndex].thumbnail,
            price: productList[productIndex].price,
            stock: ""
        })

        saveToFile(cartFile, cartList)

        res.send({ agregado: cartList[cartIndex].products })
    } else {
        res.json({ error: 'carrito o producto no encontrado' })
    }
})

routerCart.delete('/:id/productos/:id_prod', async (req, res) => {
    cartList = await fileToJSON(cartFile)
    let { id, id_prod } = req.params
    let foundCart = cartList.find( x => x.id === parseInt(id))

    if (foundCart) {
        let cartIndex = cartList.findIndex( x => x.id === parseInt(id))
        let foundProduct = cartList[cartIndex].products.find( x => x.id === parseInt(id_prod))

        if (foundProduct) {
            let productIndex = cartList[cartIndex].products.findIndex( x => x.id === parseInt(id_prod))
            let toDelete = cartList[cartIndex].products[productIndex]
            cartList[cartIndex].products.splice(productIndex, 1)

            saveToFile(cartFile, cartList)

            res.send({ eliminado: toDelete })
        } else {
            res.json({ error: 'producto no encontrado dentro del carrito' })
        }
    } else {
        res.json({ error: 'carrito no encontrado' })
    }
})

/* -------------------------------------------------- */
/* Invalid Routes */

app.get('*', function (req, res) {
    res.json({ error : -2, descripcion: `ruta ${req.path} - método ${req.method} no implementados`});
})

/* -------------------------------------------------- */
/* Listening */

const PORT = 8080
const srvConnection = app.listen(PORT, () => {
    console.log(`Conectado ${srvConnection.address().port}`)
})