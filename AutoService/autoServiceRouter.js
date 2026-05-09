const Router = require("express");
const router = new Router();
const controller = require("./autoServiceController");
const { check } = require("express-validator");

router.post(
  "/registrationAutoService",
  [
    // ❌ Убрать эти строки
    // check("login", "Логин пользователя не может быть пустым").notEmpty(),
    // check("password", "Пароль пользователя не может быть пустым").notEmpty(),
    
    // ✅ Добавить проверку на tempToken (опционально)
    check("tempToken", "Требуется подтверждение email").notEmpty(),
    check("password", "Пароль не может быть пустым").notEmpty(),
  ],
  controller.registration
);

router.post("/loginAutoService", controller.login);
router.post("/shippingAssistance", controller.getService);
router.put("/addReview", controller.addReview);
router.post("/getReviews", controller.getReviews);
router.post("/getApplication", controller.getApplication);
router.put("/updateProfile", controller.updateProfile);
router.post("/sendApplication", controller.sendApplication);
router.post("/getServiceById", controller.getServiceById);
router.put("/updateDeclarationStatus", controller.updateDeclarationStatus);
router.post("/getBookedSlots", controller.getBookedSlots);

module.exports = router;