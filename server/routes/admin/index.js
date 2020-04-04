module.exports = app => {
  const express = require("express");
  const assert = require('http-assert')
  const jwt = require('jsonwebtoken')
  const AdminUser = require('../../models/AdminUser')
  const router = express.Router({
    mergeParams: true
  });
  router.post("/", async (req, res) => {
    const model = await req.Model.create(req.body);
    res.send(model);
  });
  router.put("/:id", async (req, res) => {
    const model = await req.Model.findByIdAndUpdate(req.params.id, req.body);
    res.send(model);
  });
  router.delete("/:id", async (req, res) => {
    await req.Model.findByIdAndDelete(req.params.id, req.body);
    res.send({
      success: true
    });
  });
  router.get("/", async (req, res) => {
    const queryOptions = {};
    if (req.Model.modelName === "Category") {
      queryOptions.populate = "parent";
    }
    const items = await req.Model.find()
      .setOptions(queryOptions)
      .limit(100);
    res.send(items);
  });
  router.get("/:id", async (req, res) => {
    const model = await req.Model.findById(req.params.id);
    res.send(model);
  });

  //登录校验中间件
  const authMiddleware = require("../../middleware/auth");

  //资源中间件
  const resourceMiddleware = require("../../middleware/resource");

  //资源路由
  app.use(
    "/admin/api/rest/:resource",
    authMiddleware(),
    resourceMiddleware(),
    router
  );

  //图片上传
  const multer = require("multer");
  const upload = multer({
    dest: __dirname + "/../../uploads"
  });
  app.post(
    "/admin/api/upload",
    authMiddleware(),
    upload.single("file"),
    async (req, res) => {
      const file = req.file;
      file.url = `http://miqilin21.cn/uploads/${file.filename}`;
      res.send(file);
    }
  );

  //登录
  app.post('/admin/api/login', async (req, res) => {
    const {
      username,
      password
    } = req.body
    const user = await AdminUser.findOne({
      username
    }).select('+password')
    assert(user, 422, '用户不存在')
    const isValid = require('bcryptjs').compareSync(password, user.password)
    assert(isValid, 422, '密码错误')
    const token = jwt.sign({
      id: user._id
    }, app.get('secret'))
    res.send({
      token,
      username
    })
  })

  //错误处理函数
  app.use(async (err, req, res, next) => {
    res.status(err.statusCode || 500).send({
      message: err.message
    })
  })
};