<template>
  <PageLayout title="จัดการข้อมูลบุคลากร">
    <template v-slot:page>
      <!--User Information Section -->
      <div class="row q-col-gutter-md q-pl-md q-pt-md">
        <div class="col-12 font-18 font-bold">
          <p class="q-mb-none">จัดการข้อมูลบุคลากร</p>
        </div>
        <div class="col-12">
          <q-card flat bordered class="full-height">
            <q-card-section
              class="row wrap q-col-gutter-y-md q-col-gutter-x-md font-medium q-pb-xs font-16 text-grey-9">
              <InputGroup for-id="username" is-dense v-model="model.username" :data="model.username ?? '-'" is-require
                label="บัญชีผู้ใช้งาน" placeholder="" type="text" :is-view="isView" :error-message="isError?.username"
                :error="!!isError?.username" :rules="[(val) => !!val || 'กรุณากรอกบัญชีผู้ใช้งาน']" lazy-rules
                @blur="fetchPersonData" @keyup.enter="fetchPersonData">
              </InputGroup>
              <InputGroup for-id="prefix" is-dense :data="model.prefix ?? '-'" is-require label="คำนำหน้า"
                placeholder="" type="text" :is-view="isView">
                <q-select use-input hide-selected hide-bottom-space hide-dropdown-icon clearable
                  new-value-mode="add-unique" fill-input input-debounce="0" popup-content-class="font-14 font-regular"
                  class="font-14 font-regular" :loading="isLoading" id="selected-prefix" outlined v-model="model.prefix"
                  :options="optionPrefix" dense map-options :error-message="isError?.prefix" :error="!!isError?.prefix"
                  :rules="[(val) => !!val || 'กรุณากรอกคำนำหน้า']" lazy-rules>
                  <template v-slot:no-option>
                    <q-item>
                      <q-item-section class="text-grey font-14 font-regular">
                        ไม่มีตัวเลือก
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </InputGroup>
              <InputGroup for-id="name" is-dense v-model="model.name" :data="model.name ?? '-'" is-require
                label="ชื่อ - นามสกุล" placeholder="" type="text" :is-view="isView" :error-message="isError?.name"
                :error="!!isError?.name" :rules="[(val) => !!val || 'กรุณากรอกชื่อ - นามสกุล']" lazy-rules>
              </InputGroup>
              <InputGroup for-id="position" :data="model.positionsName ?? '-'" is-require label="ตำแหน่ง"
                :is-view="isView">
                <q-select hide-bottom-space popup-content-class="font-14 font-regular" class="font-14 font-regular"
                  :loading="isLoading" for="selected-status" outlined v-model="model.positionId" use-input
                  input-debounce="0" new-value-mode="add-unique" hide-selected hide-dropdown-icon fill-input
                  @new-value="onNewPosition" :options="optionsPosition" dense clearable option-value="id" emit-value
                  map-options option-label="name" :error-message="isError?.positionId" :error="!!isError?.positionId"
                  :rules="[(val) => !!val || 'กรุณาเลือกตำแหน่ง']" lazy-rules>
                  <template v-slot:no-option>
                    <q-item>
                      <q-item-section class="text-grey font-14 font-regular">
                        ไม่มีตัวเลือก
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </InputGroup>
              <InputGroup for-id="employee-type" :data="model.employeeTypeName ?? '-'" is-require label="ประเภทบุคลากร"
                :is-view="isView">
                <q-select hide-bottom-space popup-content-class="font-14 font-regular" class="font-14 font-regular"
                  :loading="isLoading" for="selected-employee-type" outlined v-model="model.employeeTypeId" use-input
                  input-debounce="0" new-value-mode="add-unique" hide-selected hide-dropdown-icon fill-input
                  @new-value="onNewEmployeeType" :options="optionsemployeeType" dense clearable option-value="id"
                  emit-value map-options option-label="name" :error-message="isError?.employeeTypeId"
                  :error="!!isError?.employeeTypeId" :rules="[(val) => !!val || 'กรุณาเลือกประเภทบุคลากร']" lazy-rules>
                  <template v-slot:no-option>
                    <q-item>
                      <q-item-section class="text-grey font-14 font-regular">
                        ไม่มีตัวเลือก
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </InputGroup>
              <InputGroup for-id="department" :data="model.departmentName ?? '-'" is-require label="ส่วนงาน"
                :is-view="isView">
                <q-select hide-bottom-space popup-content-class="font-14 font-regular" class="font-14 font-regular"
                  :loading="isLoading" id="selected-department" outlined v-model="model.departmentId" use-input
                  input-debounce="0" new-value-mode="add-unique" hide-selected hide-dropdown-icon fill-input
                  @new-value="onNewDepartment" :options="optionsDepartment" dense clearable option-value="id" emit-value
                  map-options option-label="name" :error-message="isError?.departmentId"
                  :error="!!isError?.departmentId" :rules="[(val) => !!val || 'กรุณาเลือกส่วนงาน']" lazy-rules>
                  <template v-slot:no-option>
                    <q-item>
                      <q-item-section class="text-grey font-14 font-regular">
                        ไม่มีตัวเลือก
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </InputGroup>
              <InputGroup for-id="sector" :data="model.sectorName ?? '-'" label="ภาควิชา" :is-view="isView">
                <q-select hide-bottom-space popup-content-class="font-14 font-regular" class="font-14 font-regular"
                  :loading="isLoading" id="selected-sector" outlined v-model="model.sectorId" :options="optionsSection"
                  use-input input-debounce="0" new-value-mode="add-unique" hide-selected hide-dropdown-icon fill-input
                  @new-value="onNewSector" dense clearable option-value="id" emit-value map-options option-label="name"
                  :error-message="isError?.sectorId" :error="!!isError?.sectorId">
                  <template v-slot:no-option>
                    <q-item>
                      <q-item-section class="text-grey font-14 font-regular">
                        ไม่มีตัวเลือก
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </InputGroup>
              <InputGroup for-id="first-working-date" label="วันที่เข้าปฏิบัติงาน" is-require :is-view="isView"
                clearable :data="model.firstWorkingDate ?? '-'">
                <DatePicker is-dense hide-bottom-space v-model:model="model.firstWorkingDate"
                  v-model:dateShow="model.firstWorkingDate" for-id="first-working-date" :no-time="true"
                  :err="isError?.firstWorkingDate" :error-message="isError?.firstWorkingDate"
                  :rules="[(val) => !!val || 'กรุณาเลือกวันที่เข้าปฏิบัติงาน']" />
              </InputGroup>
            </q-card-section>
            <q-card-section class="row column wrap font-medium q-pt-none font-16 text-grey-9">
              <InputGroup for-id="psn-id" is-dense v-model="model.psn_id" :data="model.psn_id ?? '-'" is-require
                label="หมายเลขรหัสบุคลากร" placeholder="" type="text" :is-view="isView"
                :error-message="isError?.psn_id" :error="!!isError?.psn_id"
                :rules="[(val) => !!val || 'กรุณากรอกหมายเลขรหัสบุคลากร']" lazy-rules>
              </InputGroup>
              <p class="q-mb-sm require">บทบาท</p>
              <q-option-group v-if="!isView && !isLoading" v-model="model.roleId" :options="optionRole"
                option-value="id" option-label="name" :color="isError.roleId ? 'red' : 'primary'"
                :keep-color="isError.roleId ?? false" id="role" />
              <p v-else class="font-regular">{{ model.roleName }}</p>
            </q-card-section>
            <q-card-section class="row wrap font-medium q-pb-sm font-16 text-grey-9 q-col-gutter-md">
              <p class="col-12 q-mb-md require">ที่อยู่</p>
              <InputGroup for-id="house-number" is-dense v-model="model.houseNumber" :data="model.houseNumber ?? '-'"
                is-require label="บ้านเลขที่" placeholder="" type="text" :is-view="isView"
                :error-message="isError?.houseNumber" :error="!!isError?.houseNumber"
                :rules="[(val) => !!val || 'กรุณากรอกบ้านเลขที่']" lazy-rules>
              </InputGroup>
              <InputGroup for-id="street" is-dense v-model="model.street" :data="model.street ?? '-'" is-require
                label="ถนน" placeholder="" type="text" :is-view="isView" :error-message="isError?.street"
                :error="!!isError?.street" :rules="[(val) => !!val || 'กรุณากรอกถนน']" lazy-rules>
              </InputGroup>
              <InputGroup for-id="province" is-dense :data="model.province ?? '-'" is-require label="จังหวัด"
                placeholder="" type="text" :is-view="isView">
                <q-select @filter="filterFn" @filter-abort="abortFilterFn" hide-bottom-space use-input
                  input-debounce="100" clearable popup-content-class="font-14 font-regular" class="font-14 font-regular"
                  :loading="isLoading" id="selected-province" outlined v-model="model.province"
                  :options="optionProvinceSelected" dense option-value="name_th" emit-value map-options
                  option-label="name_th" :error="!!isError?.province" :rules="[(val) => !!val || 'กรุณากรอกจังหวัด']"
                  lazy-rules>
                  <template v-slot:no-option>
                    <q-item>
                      <q-item-section class="text-grey font-14 font-regular">
                        ไม่มีตัวเลือก
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </InputGroup>
              <InputGroup for-id="district" is-dense :data="model.district ?? '-'" is-require label="อำเภอ / เขต"
                placeholder="" type="text" :is-view="isView">
                <q-select @filter="filterFnDistrict" @filter-abort="abortFilterFnDistrict" use-input hide-bottom-space
                  input-debounce="100" clearable popup-content-class="font-14 font-regular" class="font-14 font-regular"
                  :loading="isLoading" id="selected-district" outlined v-model="model.district"
                  :options="optionsDistrict" dense option-value="name_th" emit-value map-options option-label="name_th"
                  :error="!!isError?.district" :error-message="isError?.district"
                  :rules="[(val) => !!val || 'กรุณากรอกอำเภอ / เขต']" lazy-rules>
                  <template v-slot:no-option>
                    <q-item>
                      <q-item-section class="text-grey font-14 font-regular">
                        ไม่มีตัวเลือก
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </InputGroup>
              <InputGroup for-id="sub-district" is-dense :data="model.subDistrict ?? '-'" is-require label="ตำบล / แขวง"
                placeholder="" type="text" :is-view="isView">
                <q-select @filter="filterFnSubDistrict" @filter-abort="abortFilterFnSubDistrict" use-input
                  hide-bottom-space input-debounce="100" clearable popup-content-class="font-14 font-regular"
                  class="font-14 font-regular" :loading="isLoading" id="selected-sub-district" outlined
                  v-model="model.subDistrict" :options="optionsSubDistrict" dense option-value="name_th" emit-value
                  map-options option-label="name_th" :error-message="isError?.subDistrict"
                  :error="!!isError?.subDistrict" :rules="[(val) => !!val || 'กรุณากรอกตำบล / แขวง']" lazy-rules>
                  <template v-slot:no-option>
                    <q-item>
                      <q-item-section class="text-grey font-14 font-regular">
                        ไม่มีตัวเลือก
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </InputGroup>
              <InputGroup for-id="postal-code" is-dense v-model="model.postalCode" :data="model.postalCode ?? '-'"
                is-require label="รหัสไปรษณีย์" placeholder="" type="text" :is-view="isView"
                :error-message="isError?.postalCode" :error="!!isError?.postalCode"
                :rules="[(val) => !!val || 'กรุณากรอกรหัสไปรษณีย์']" lazy-rules>
              </InputGroup>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 row justify-between font-18 font-bold">
          <p class="q-mb-none">จัดการข้อมูลบุตร</p>
          <q-btn v-if="!isView && !isLoading" icon="add" id="add-req" @click="addChildForm"
            class="bg-blue-10 text-white">เพิ่ม</q-btn>
        </div>
        <!-- Child Section -->
        <div class="col-12">
          <q-card flat bordered class="full-height">
            <q-card-section
              class="row items-center wrap q-col-gutter-md wrap font-medium q-pt-sm q-pb-none font-16 text-grey-9"
              v-for="(item, index) in model.child" :key="index">
              <p class="col-12 q-mb-none">บุตรคนที่ {{ index + 1 }}</p>
              <InputGroup for-id="prefix-child" is-dense :data="item.prefix ?? '-'" label="คำนำหน้า"
                placeholder="" type="text" :is-view="isView" :class="!isView ? 'q-pt-md q-pt-sm-none q-pb-xs' : ''">
                <q-select use-input hide-selected hide-dropdown-icon clearable new-value-mode="add-unique" fill-input
                  input-debounce="0" popup-content-class="font-14 font-regular" class="font-14 font-regular"
                  :loading="isLoading" id="selected-prefix" outlined v-model="item.prefix" :options="optionPrefixChild"
                  dense map-options>
                  <template v-slot:no-option>
                    <q-item>
                      <q-item-section class="text-grey font-14 font-regular">
                        ไม่มีตัวเลือก
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </InputGroup>
              <InputGroup for-id="child-name" is-dense v-model="item.name" :hide-bottom="false" :data="item.name ?? '-'"
                label="ชื่อ - นามสกุล" placeholder="" type="text" :is-view="isView">
              </InputGroup>
              <InputGroup label="เกิดเมื่อ" :is-view="isView" clearable
                :data="formatDateThaiSlash(item.birthday) ?? '-'">
                <DatePicker is-dense v-model:model="item.birthday" :hide-bottom="false" v-model:dateShow="item.birthday"
                  for-id="birthday" :no-time="true" />
              </InputGroup>
              <div>
                <q-btn v-if="
                  (index > 0 && !isView && !isLoading) ||
                  (isEdit && !isView && item?.id && !isLoading)
                " color="red" @click="removeChildForm(index)" class="q-mt-sm">ลบ</q-btn>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </template>
    <!--Action Slot -->
    <template v-slot:action>
      <div class="justify-end row q-py-xs font-medium q-gutter-lg">
        <q-btn id="button-back" class="text-white font-medium font-16 weight-8 q-px-md" dense type="button"
          style="background: #bfbfbf" label="ย้อนกลับ" no-caps :to="{ name: 'user_management_list' }" />
        <q-btn id="button-save" class="text-white font-medium bg-blue-9 text-white font-16 weight-8 q-px-lg" dense
          type="submit" label="บันทึก" no-caps @click="submit()" v-if="!isView && !isLoading" />
      </div>
    </template>
  </PageLayout>
</template>
<style scoped>
.q-table--bordered {
  border-radius: 0;
}
</style>
<script setup>
import PageLayout from 'src/layouts/PageLayout.vue'
import InputGroup from 'src/components/InputGroup.vue'
import DatePicker from 'src/components/DatePicker.vue'

import Swal from 'sweetalert2'
import { Notify } from 'quasar'
import { formatDateThaiSlash, formatDateSlash, formatDateServer } from 'src/components/format'

import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import userManagementService from 'src/boot/service/userManagementService'
import departmentService from 'src/boot/service/departmentService'
import sectorService from 'src/boot/service/sectorService'
import positionService from 'src/boot/service/positionService'
import employeeTypeService from 'src/boot/service/employeeTypeService'
import roleService from 'src/boot/service/roleService'
import data from 'src/components/api_province_with_amphure_tambon.json'

defineOptions({
  name: 'MedicalfareEdit',
})
const router = useRouter()
const route = useRoute()
const model = ref({
  id: null,
  prefix: null,
  username: null,
  name: null,
  positionId: null,
  positionsName: null,
  employeeTypeId: null,
  employeeTypeName: null,
  departmentId: null,
  departmentName: null,
  sectorId: null,
  sectorName: null,
  firstWorkingDate: null,
  psn_id: null,
  roleId: null,
  roleName: null,
  houseNumber: null,
  street: '-',
  district: null,
  subDistrict: null,
  province: null,
  postalCode: null,
  child: [
    {
      prefix: null,
      name: null,
      birthday: null,
    },
  ],
  deleteChild: [],
})
const isLoading = ref()
const isError = ref({})
const isView = ref(false)
const optionPrefix = ref(['นาย', 'นาง', 'นางสาว'])
const optionPrefixChild = ref(['นาย', 'นาง', 'นางสาว', 'ด.ช.', 'ด.ญ.'])

const optionsProvince = computed(() => {
  if (!isView.value) return data
  else return []
})
const optionProvinceSelected = ref([])
const optionsDistrict = ref([])
const optionsSubDistrict = ref([])
const getDistrict = computed(() => {
  if (!isView.value) {
    const findData = optionsProvince.value.filter(
      (province) => province.name_th == model.value.province,
    )
    return findData[0] ? findData[0].amphure : []
  }
  return []
})
const getSubDistrict = computed(() => {
  if (!isView.value) {
    const findData = getDistrict.value.filter(
      (district) => district.name_th == model.value.district,
    )
    return findData[0] ? findData[0].tambon : []
  }
  return []
})

async function filterFn(val, update) {
  try {
    setTimeout(async () => {
      update(() => {
        if (val === '') {
          optionProvinceSelected.value = optionsProvince.value
        } else {
          optionProvinceSelected.value = optionsProvince.value.filter((v) =>
            v.name_th.includes(val),
          )
        }
      })
    }, 650)
  } catch (error) {
    Promise.reject(error)
  }
}
function abortFilterFn() {
  // console.log('delayed filter aborted')
}
async function filterFnDistrict(val, update) {
  try {
    setTimeout(async () => {
      update(() => {
        if (val === '') {
          optionsDistrict.value = getDistrict.value
        } else {
          optionsDistrict.value = getDistrict.value.filter((v) => v.name_th.includes(val))
        }
      })
    }, 650)
  } catch (error) {
    Promise.reject(error)
  }
}
function abortFilterFnDistrict() {
  // console.log('delayed filter aborted')
}
async function filterFnSubDistrict(val, update) {
  try {
    setTimeout(async () => {
      update(() => {
        if (val === '') {
          optionsSubDistrict.value = getSubDistrict.value
        } else {
          optionsSubDistrict.value = getSubDistrict.value.filter((v) => v.name_th.includes(val))
        }
      })
    }, 650)
  } catch (error) {
    Promise.reject(error)
  }
}
function abortFilterFnSubDistrict() {
  // console.log('delayed filter aborted')
}

const isEdit = computed(() => {
  return !isNaN(route.params.id)
})

onMounted(async () => {
  await init()
  isLoading.value = false
})

onBeforeUnmount(() => {
  model.value = null
})

function addChildForm() {
  model.value.child.push({
    prefix: null,
    name: null,
    birthday: null,
  })
}
function removeChildForm(index) {
  Swal.fire({
    title: 'ยืนยันการทำรายการหรือไม่ ???',
    html: `ไม่ต้องห่วง ข้อมูลบุตรจะถูกลบเมื่อคุณคลิกปุ่ม "บันทึก"`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'ยืนยัน',
    cancelButtonText: 'ยกเลิก',
    reverseButtons: true,
    customClass: {
      confirmButton: 'save-button',
      cancelButton: 'cancel-button',
    },
  }).then((result) => {
    if (result.isConfirmed) {
      if (isEdit.value && model.value.child[index]?.id) {
        if (!Array.isArray(model.value.deleteChild)) {
          model.value.deleteChild = []
        }
        if (model.value && Array.isArray(model.value.deleteChild)) {
          model.value.deleteChild.push({ id: model.value.child[index].id })
        }
      }
      model.value.child.splice(index, 1)
      if (model.value.child.length == 0) {
        addChildForm()
      }
    }
  })
}

watch(
  model,
  () => {
    if (!isView.value) {
      Object.keys(model.value).forEach((key) => {
        if (model.value[key] !== null) {
          delete isError.value[key]
        }
      })
    }
    validateFirstWorkingDate();
  },
  { deep: true },
)

function validateFirstWorkingDate() {
  if (model.value.firstWorkingDate != null) {
    const inputDate = new Date(model.value.firstWorkingDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    inputDate.setHours(0, 0, 0, 0)
    if (inputDate > today) {
      isError.value.firstWorkingDate = 'วันที่เริ่มเข้าปฏิบัติงานไม่สามารถมากกว่าวันนี้ได้'
    } else {
      isError.value.firstWorkingDate = null
    }
  } else {
    isError.value.firstWorkingDate = 'กรุณาเลือกวันที่เริ่มเข้าปฏิบัติงาน'
  }
}


async function submit() {
  let validate = false
  if (!model.value.username) {
    isError.value.username = 'กรุณากรอกข้อมูลบัญชีผู้ใช้'
    validate = true
  }
  if (!model.value.prefix) {
    isError.value.prefix = 'กรุณากรอกคำนำหน้าชื่อ'
    validate = true
  }
  if (!model.value.name) {
    isError.value.name = 'กรุณากรอกชื่อ - นามสกุล'
    validate = true
  }
  if (!model.value.positionId) {
    isError.value.positionId = 'กรุณาเลือกตำแหน่ง'
    validate = true
  }
  if (!model.value.employeeTypeId) {
    isError.value.employeeTypeId = 'กรุณาเลือกประเภทบุคลากร'
    validate = true
  }
  if (!model.value.departmentId) {
    isError.value.departmentId = 'กรุณาเลือกส่วนงาน'
    validate = true
  }
  if (!model.value.firstWorkingDate) {
    isError.value.firstWorkingDate = 'กรุณาเลือกวันที่เข้าปฏิบัติงาน'
    validate = true
  }
  if (!model.value.psn_id) {
    isError.value.username = 'กรุณากรอกหมายเลข psn id'
    validate = true
  }
  if (!model.value.houseNumber) {
    isError.value.houseNumber = 'กรุณากรอกบ้านเลขที่'
    validate = true
  }
  if (!model.value.street) {
    isError.value.street = 'กรุณากรอกถนน'
    validate = true
  }
  if (!model.value.district) {
    isError.value.district = 'กรุณากรอก อำเภอ/เขต'
    validate = true
  }
  if (!model.value.subDistrict) {
    isError.value.subDistrict = 'กรุณากรอก ตำบล/แขวง'
    validate = true
  }
  if (!model.value.province) {
    isError.value.province = 'กรุณากรอกจังหวัด'
    validate = true
  }
  if (!model.value.postalCode) {
    isError.value.postalCode = 'กรุณากรอกรหัสไปรษณีย์'
    validate = true
  }
  if (!model.value.roleId) {
    isError.value.roleId = true
    validate = true
  }
  if (validate === true) {
    let navigate = document.getElementById('username')
    window.location.hash = 'username'
    navigate.scrollIntoView(false)
    Notify.create({
      message: 'กรุณากรอกข้อมูลให้ถูกต้อง',
      position: 'bottom-left',
      type: 'negative',
    })
    return
  }
  if (model.value.sectorId == '-') {
    model.value.sectorId = null;
  }
  model.value.child = model.value.child.filter(
    (item) => !Object.values(item).some((value) => value === null || value === ''),
  )
  let isValid = false
  var fetch
  Swal.fire({
    title: 'ยืนยันการทำรายการหรือไม่ ???',
    html: `โปรดตรวจสอบข้อมูลให้แน่ใจก่อนยืนยัน`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'ยืนยัน',
    cancelButtonText: 'ยกเลิก',
    showLoaderOnConfirm: true,
    reverseButtons: true,
    customClass: {
      confirmButton: 'save-button',
      cancelButton: 'cancel-button',
    },
    preConfirm: async () => {
      try {
        if (model.value.firstWorkingDate) {
          model.value.firstWorkingDate = formatDateServer(model.value.firstWorkingDate);
        }
        if (model.value.child.length === 0) {
          delete model.value.child
        }
        else {
          model.value.child.forEach(child => {
            if (child.birthday) {
              child.birthday = formatDateServer(child.birthday);
            }
          });
        }
        if (isEdit.value) {
          fetch = await userManagementService.update(route.params.id, model.value)
        } else {
          fetch = await userManagementService.create(model.value)
        }
        isValid = true
      } catch (error) {
        if (error?.response?.status == 400) {
          if (Object.keys(error?.response?.data?.errors ?? {}).length) {
            isError.value = {
              ...isError.value,
              ...error.response?.data?.errors,
            }
          }
        }
        Swal.fire({
          html: error?.response?.data?.message ?? `เกิดข้อผิดพลาดกรุณาลองอีกครั้ง`,
          icon: "error",
          confirmButtonText: "ตกลง",
          customClass: {
            confirmButton: "save-button",
          },
        });
      }
    },
  }).then((result) => {
    if (isValid && result.isConfirmed) {
      Swal.fire({
        html: fetch.data?.message ?? `บันทึกข้อมูลสำเร็จ`,
        icon: 'success',
        confirmButtonText: 'ตกลง',
        customClass: {
          confirmButton: 'save-button',
        },
      }).then(() => {
        router.replace({ name: 'user_management_list' })
      })
    }
  })
}
const optionsPosition = ref([])
const optionsemployeeType = ref([])
const optionsDepartment = ref([])
const optionsSection = ref([])
const optionRole = ref([])
function onNewPosition(val) {
  const existing = optionsPosition.value.find(opt => opt.name === val);
  if (existing) {
    model.value.positionId = existing.id;
  } else {
    model.value.positionId = val;
  }
}
function onNewEmployeeType(val) {
  const existing = optionsemployeeType.value.find(opt => opt.name === val);
  if (existing) {
    model.value.employeeTypeId = existing.id;
  } else {
    model.value.employeeTypeId = val;
  }
}
function onNewDepartment(val) {
  const existing = optionsDepartment.value.find(opt => opt.name === val);
  if (existing) {
    model.value.departmentId = existing.id;
  } else {
    model.value.departmentId = val;
  }
}
function onNewSector(val) {
  const existing = optionsSection.value.find(opt => opt.name === val);
  if (existing) {
    model.value.sectorId = existing.id;
  } else {
    model.value.sectorId = val;
  }
}


async function fetchInitialData() {
  try {
    const [fetchPosition, fetchDepartment, fetchSector, fetchemployeeType, fetchRole] =
      await Promise.all([
        positionService.list(),
        departmentService.list(),
        sectorService.list(),
        employeeTypeService.list(),
        roleService.list(),
      ])

    optionsPosition.value = fetchPosition.data
    optionsemployeeType.value = fetchemployeeType.data
    optionsDepartment.value = fetchDepartment.data
    optionsSection.value = fetchSector.data
    optionRole.value = fetchRole.data
  } catch (error) {
    return Promise.reject(error)
  }
}
async function init() {
  isView.value = route.meta.isView
  isLoading.value = true
  if (!isView.value) {
    await fetchInitialData()
  }
  if (isEdit.value) {
    try {
      let res = await userManagementService.dataById(route.params.id)
      const dataBinding = res.data.datas
      const convertDate =
        isView.value === true
          ? formatDateThaiSlash(dataBinding.firstWorkingDate)
          : formatDateSlash(dataBinding.firstWorkingDate)
      const childData = [
        {
          prefix: null,
          name: null,
          birthday: null,
        },
      ]
      const prefix = dataBinding.name.split(' ')[0]
      const name = dataBinding.name.split(' ').slice(1).join(' ')
      model.value = {
        id: dataBinding.id,
        prefix: prefix ?? '-',
        name: name ?? '-',
        username: dataBinding.username ?? '-',
        firstWorkingDate: convertDate,
        psn_id: dataBinding?.psn_id ?? null,
        positionId: dataBinding?.position?.id ?? '-',
        positionsName: dataBinding?.position?.name ?? '-',
        employeeTypeId: dataBinding?.employeeType?.id ?? '-',
        employeeTypeName: dataBinding?.employeeType?.name ?? '-',
        departmentId: dataBinding?.department?.id ?? '-',
        departmentName: dataBinding?.department?.name ?? '-',
        sectorId: dataBinding?.sector?.id ?? '-',
        sectorName: dataBinding?.sector?.name ?? '-',
        roleId: dataBinding?.role?.id ?? '-',
        roleName: dataBinding?.role?.name ?? '-',
        houseNumber: dataBinding?.houseNumber ?? '-',
        street: dataBinding?.street ?? '-',
        district: dataBinding?.district ?? '-',
        subDistrict: dataBinding?.subDistrict ?? '-',
        province: dataBinding?.province ?? '-',
        postalCode: dataBinding?.postalCode ?? '-',
      }
      if (Array.isArray(dataBinding.children) && dataBinding.children.length > 0) {
        const newChild = dataBinding.children.map((child) => {
          const childPrefix = child?.name.split(' ')[0]
          const childName = child?.name.split(' ').slice(1).join(' ')
          return {
            id: child?.id,
            prefix: childPrefix,
            name: childName,
            birthday: formatDateSlash(child?.birthday),
          }
        })
        model.value.child = newChild
      } else {
        model.value.child = childData
      }
      model.value.child
      isLoading.value = false
    } catch (error) {
      console.log(error)
      Notify.create({
        message: error.response?.data?.message ?? 'เกิดข้อผิดพลาดกรุณาลองอีกครั้ง',
        position: 'bottom-left',
        type: 'negative',
      })
      router.replace({ name: 'user_management_list' })
    }
  } else {
    isLoading.value = false
  }
}
// fetchPersonData()
// This function is used to fetch person's data form usm.
async function fetchPersonData() {
    try {
        const result = await userManagementService.getPersonByUsername(model.value.username);
        const person = result.data?.data;
        if (person) {
            model.value.psn_id = person.psn_id
            model.value.name = person.psn_fullname
            model.value.prefix = person.prf_nameth
        }
    } catch (error) {
        console.log(error);
    }
}
</script>
