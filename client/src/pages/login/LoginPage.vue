<template>
    <div class="row bg-blue-10 justify-center" style="height: 100vh;">
        <div class="col-12 col-md-6 flex justify-center content-center">
            <q-card class="q-pa-md " :style="{
                width: $q.screen.lt.sm ? '90%' : '60%',

                borderRadius: '12px',
                boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.7)'
            }">
                <q-card-section class="flex justify-center">
                    <img src="../../assets/loginlogo.svg" alt="login-logo" />
                </q-card-section>

                <q-card-section class="text-center">
                    <h2 class="text-h4 font-bold text-uppercase">ระบบเบิกสวัสดิการ</h2>
                </q-card-section>

                <q-card-section>
                    <q-form @submit="login" class="q-gutter-md q-px-xl">
                        <!-- Username -->
                        <q-input v-model="model.username" label="Username" :error-message="isError.username"
                            :error="!!isError.username" :rule="[val => val || 'กรุณากรอกบัญชีผู้ใช้']" />
                        <!-- Password -->
                        <q-input v-model="model.password" label="Password" :type="isPwd ? 'password' : 'text'"
                            :error-message="isError.password" :error="!!isError.password"
                            :rule="[val => val || 'กรุณากรอกรหัสผ่าน']">
                            <template v-slot:append>
                                <q-icon :name="isPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer"
                                    @click="isPwd = !isPwd" />
                            </template>
                        </q-input>

                        <q-btn :loading="isLoading" class="full-width" type="submit" color="primary" label="Login" />
                    </q-form>
                </q-card-section>
            </q-card>
        </div>

    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useAuthStore } from "src/stores/authStore";
import { Notify } from "quasar";
import accountService from 'src/boot/service/accountService';
import { useMenuStore } from 'src/stores/menuStore';
import { useRouter } from 'vue-router';
const NOTICE_MESSAGE = "ระบบมีการบันทึกข้อมูลการเข้าใช้งานและกิจกรรมที่เกิดขึ้นภายในระบบ เพื่อใช้ในการตรวจสอบและรักษาความปลอดภัย ทั้งนี้ข้อมูลจะถูกจัดเก็บตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล";

const model = ref({
    username: null,
    password: null,
});

const authStore = useAuthStore();
const isLoading = ref(false);
const isPwd = ref(true);
const menuStore = useMenuStore();
const router = useRouter();
// โหลด Username จาก localStorage
onMounted(() => {
    authStore.clearToken();
});

// Login
async function login() {
    var validate = false;
    if (!model.value.username) {
        isError.value.username = "กรุณากรอกบัญชีผู้ใช้งาน";
        validate = true;
    }
    if (!model.value.password) {
        isError.value.password = "กรุณากรอกรหัสผ่าน";
        validate = true;
    }
    if (validate === true) {
        Notify.create({
            message: "กรุณากรอกบัญชีผู้ใช้งานและรหัสผ่านให้ถูกต้อง",
            position: "bottom-left",
            type: "negative",
        });
        return;
    }
    isLoading.value = true;
    try {
        const result = await accountService.login(model.value)
        if (result.data.user) {
            authStore.setToken(result.data?.accessToken);
            authStore.name = result.data?.user?.name;
            authStore.id = result.data?.user?.id;
            authStore.position = result.data?.user?.position;
            authStore.email = result.data?.user?.email;
            authStore.department = result.data?.user?.department;
            authStore.roleId = result.data?.user?.roleId;
            authStore.isEditor = result.data?.user?.isEditor;
            authStore.isStaff = result.data?.user?.isStaff;
            authStore.roleName = result.data?.user?.roleName;
            menuStore.setPath(result.data?.user?.path);
            menuStore.setPathEditor(result.data?.user?.pathEditor);

            // PDPA notice: แจ้งให้ผู้ใช้ทราบว่ามีการบันทึกกิจกรรมเพื่อความปลอดภัย/การปฏิบัติตามกฎระเบียบ
            Notify.create({
                message: NOTICE_MESSAGE,
                type: "warning",
                position: "top",
                multiLine: true,
                timeout: 8000,
            });
            if(result?.data?.user?.redirectTo){
              router.push({ name: result?.data?.user?.redirectTo });
            }
            else{
              router.push({ name: "home" });
            }
            Notify.create({
                message: "Success",
                position: "bottom-left",
                type: "positive",
            });
        }
        isLoading.value = false;
    } catch (error) {
        isLoading.value = false;
        isError.value.password =
            error?.response?.data?.errors?.password ??
            "เข้าสู่ระบบล้มเหลว กรุณาลองอีกครั้ง";
        isError.value.username =
            error?.response?.data?.errors?.username
        Notify.create({
            message:
                "เข้าสู่ระบบล้มเหลว กรุณาลองอีกครั้ง",
            position: "bottom-left",
            type: "negative",
        });
    }

  };
  const isError = ref({
    username: null,
    password: null,
});

onBeforeUnmount(() => {
    clearData();
});

function clearData() {
    Object.keys(model.value).forEach((key) => {
        model.value[key] = null;
    });
}
  </script>

