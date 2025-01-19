import express from "express";
import authRoutes from "./auth.routes";
import businessRoutes from "./business.routes";
import userRoutes from "./user.routes"
import adminRoutes from "./admin.routes";
// import businessRoutes from './business.routes';
// import reviewRoutes from './review.routes';
// import adminRoutes from './admin.routes';
// import tagRoutes from './tag.routes';

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/business",businessRoutes)
router.use("/user",userRoutes)
router.use("/admin",adminRoutes)
// router.use('/business', businessRoutes);
// router.use('/reviews', reviewRoutes);
// router.use('/admin', adminRoutes);
// router.use('/tags', tagRoutes);

export default router;
