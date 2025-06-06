/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import http from 'node:http'
import express from "express"
import { afterAll, beforeAll } from "@jest/globals"

import { port } from "../jest.config"

import type { Request as ERequest, Response as EResponse } from "express-serve-static-core"

import type { ExecRequest } from "jolokia.js"

let server: http.Server

beforeAll(() => {
  console.info(`Starting express.js listening at port ${port}`)
  server = http.createServer({}, app).listen(port)
})

afterAll(async () => {
  server.closeAllConnections()
  await new Promise((resolve, reject) => {
    server.close((err?: Error) => {
      if (err) {
        console.info(`Stopped express.js with error: ${err}`)
        reject(err)
      } else {
        console.info("Stopped express.js")
        resolve(true)
      }
    })
  })
})

const jolokiaRouter = express.Router()

jolokiaRouter.all(/.*/, (_req, res, next) => {
  res.set("Content-Type", "application/json")
  next()
})

let versionHandler = (_req: ERequest, res: EResponse) => {
  res.status(200).json({
    status: 200,
    timestamp: Date.now(),
    request: { type: "version" },
    value: {
      agent: "2.1.0",
      protocol: "8.1"
    }
  })
}
jolokiaRouter.get("", versionHandler)
jolokiaRouter.get("/version", versionHandler)

jolokiaRouter.post("/*", (req: ERequest, res: EResponse) => {
  let body = req.body

  if (!body || !body.type) {
    body = { type: "?" }
  }

  switch (body.type) {
    case "read": {
      if (body.mbean === "java.lang:type=Runtime") {
        if (!body.attribute) {
          res.status(200).json({
            status: 200,
            request: body,
            value: {
              "Name": "15699@everfree.forest"
            }
          })
        } else if (body.attribute === "Name") {
          res.status(200).json({
            status: 200,
            request: body,
            value: "15699@everfree.forest"
          })
        }
      } else if (body.mbean === "org.apache.activemq.artemis:broker=127.0.0.1") {
        // see ArtemisService.initBrokerInfo
        res.status(200).json({
          status: 200,
          request: body,
          value: {
            Name: "127.0.0.1",
            NodeID: "0",
            Version: "2.41.0",
            Started: "true",
            GlobalMaxSize: 1024,
            AddressMemoryUsage: 1024,
            Uptime: 3600,
            HAPolicy: "org.apache.activemq.artemis.core.server.cluster.ha.ReplicatedPolicy"
          }
        })
      }
      break
    }
    case "write": {
      break
    }
    case "exec": {
      const v = body as ExecRequest
      if (v.operation === "listAddresses(java.lang.String,int,int)") {
        res.status(200).send({
          status: 200,
          request: body,
          value: JSON.stringify({
            data: ["DLQ"],
            count: 1
          })
        })
      }
      break
    }
    case "search": {
      if (body.mbean === "org.apache.activemq.artemis:broker=*") {
        res.status(200).json({
          status: 200,
          request: body,
          value: [
            "org.apache.activemq.artemis:broker=127.0.0.1"
          ]
        })
      } else {
        res.status(200).json({
          status: 200,
          request: body,
          value: [
            "java.lang:type=Runtime",
            "java.lang:type=Threading"
          ]
        })
      }
      break
    }
    case "list": {
      res.status(200).json({
        status: 200,
        request: body,
        value: {
          "JMImplementation": {
            "type=MBeanServerDelegate": {
              "attr": {
                "ImplementationName": {
                  "rw": false,
                  "type": "java.lang.String",
                  "desc": "The JMX implementation name (the name of this product)"
                }
              }
            }
          }
        }
      })
      break
    }
    case "version": {
      res.status(200).json({
        status: 200,
        request: body,
        value: {
          agent: "2.1.0",
          protocol: "8.0"
        }
      })
      break
    }
    default: {
      res.status(200).json({
        status: 500,
        request: body,
        error_type: "java.lang.UnsupportedOperationException",
        error: "java.lang.UnsupportedOperationException : No type with name '" + body.type + "' exists"
      })
      break
    }
  }
})

const hawtioRouter = express.Router()

hawtioRouter.get("/keycloak/enabled", (_req, res) => {
  res.status(200).send("false")
})
hawtioRouter.get("/auth/config", (_req, res) => {
  res.status(200).json({})
})
hawtioRouter.get("/hawtconfig.json", (_req, res) => {
  res.status(200).json({})
})
hawtioRouter.get("/artemisconfig.json", (_req, res) => {
  res.status(200).json({
    "jmx": {
      "domain": "org.apache.activemq.artemis"
    }
  })
})
hawtioRouter.get("/user", (_req, res) => {
  res.status(200).send("\"activemq\"")
})

// main Jolokia endpoint which simulates full hawtio/hawtio server
hawtioRouter.use("/jolokia", jolokiaRouter)

const app = express()
app.use(express.json({ type: "*/json" }))

app.use("/hawtio", hawtioRouter)
