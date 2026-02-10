<template>
    <PageLayout title="เบิกสวัสดิการเกี่ยวกับการศึกษาของบุตร">
        <template v-slot:page>
            <!--General Information Section -->
            <div class="row q-col-gutter-md q-pl-md q-pt-md">
                <div :class="isView ? 'col-md-12 col-12' : 'col-md-9 col-12'">
                    <q-card flat bordered class="full-height">

                        <q-card-section class="font-18 font-bold">
                            <p class="q-mb-none">ข้อมูลผู้เบิกสวัสดิการ</p>
                        </q-card-section>

                        <q-separator />

                        <q-card-section class="row wrap q-col-gutter-y-md q-pb-sm font-16 font-bold">
                            <div class="col-lg-5 col-12 col-xl-4 row q-gutter-y-md q-pr-sm">
                                <p class="col-auto q-mb-none">
                                    ชื่อ-นามสกุล : <span class="font-medium font-16 text-grey-7">{{
                                        userData?.name ?? "-" }}</span>
                                </p>

                            </div>
                            <p class="col-lg-3 col-xl-4 col-12 q-mb-none q-pr-sm text-no-wrap ellipsis"
                                :title="userData?.position ?? '-'">
                                ตำแหน่ง : <span class="font-medium font-16 text-grey-7">{{
                                    userData?.position ?? "-" }}</span>
                            </p>
                            <p class="col-lg col-xl-4 col-12 q-mb-none text-no-wrap ellipsis"
                                :title="userData?.employeeType ?? '-'">
                                ประเภทบุคลากร : <span class="font-medium font-16 text-grey-7">{{
                                    userData?.employeeType ?? "-" }}</span>
                            </p>
                            <p class="col-lg-5 col-xl-4 col-12 q-mb-none q-pr-sm">ส่วนงาน : <span
                                    class="font-medium font-16 text-grey-7">{{
                                        userData?.department ?? "-" }}</span></p>
                            <p class="col-lg col-xl-4 col-12 q-mb-none q-pr-sm">ภาควิชา : <span
                                    class="font-medium font-16 text-grey-7">{{
                                        userData?.sector ?? "-" }}</span>
                            </p>
                        </q-card-section>

                    </q-card>

                </div>

                <div v-if="!isView" class="col-md-3 col-12">
                    <q-card flat bordered class="full-height">
                        <q-card-section class="q-px-md q-py-md font-18 font-bold">
                            <p class="q-mb-none">จำนวนเงินที่เบิกไปแล้ว</p>
                        </q-card-section>
                        <q-separator />
                        <q-card-section class="q-px-md q-py-md font-medium font-16 text-grey-7">
                            <p v-for="child in displayedChildren" :key="child.index" class="q-mb-none">
                                บุตรคนที่ {{ child.index }}: {{ child.fundRemaining || '-' }} บาท
                            </p>
                        </q-card-section>
                    </q-card>
                </div>
            </div>

            <!-- Request Section -->
            <div class="row q-col-gutter-md q-pl-md q-pt-md ">
                <div class="col-md-9 col-12">
                    <q-card flat bordered class="full-height">
                        <q-card-section class="flex justify-between q-px-md q-pt-md q-pb-md font-18 font-bold">
                            <p class="q-mb-none font-18 font-bold">ข้อมูลการเบิกสวัสดิการ</p>
                            <a class="q-mb-none font-regular font-16 text-blue-7 cursor-pointer"
                                v-if="isView && (model.status == 'รอตรวจสอบ')" @click.stop.prevent="
                                    downloadData()">
                                <q-icon :name="outlinedDownload" />
                                <span> Export</span>
                            </a>
                        </q-card-section>

                        <q-card-section class="q-px-md q-pb-none font-18 font-bold q-pt-none">

                            <q-card-section v-show="isView || isEdit"
                                class="row wrap font-medium q-pb-xs q-pl-none q-pt-none q-mb-md font-16 text-grey-9">
                                <p class="col-md-3 col-12 q-mb-none">เลขที่ใบเบิก : {{ model.reimNumber ?? "-" }}</p>
                                <p class="col-md-3 col-12 q-mb-none">วันที่ร้องขอ : {{
                                    formatDateThaiSlash(model.requestDate) ?? "-"
                                }}
                                </p>
                                <p class="col-md-3 col-12 q-mb-none q-pl-sm">สถานะ : <span
                                        :class="textStatusColor(model.status)">{{
                                            model.status ?? "-" }}</span></p>
                            </q-card-section>


                            <div v-if="isView" class="row q-mt-lg q-mb-none">

                                <div v-if="isView" class="col-md-3 col-12 q-mb-none">
                                    <p class="font-16 require font-medium text-grey-9">สถานะ (ผู้เบิกที่มีต่อบุตร)</p>
                                    <div class="font-14 font-regular text-grey-9">
                                        {{ selectedparentalStatusLabel || '-' }}
                                    </div>
                                </div>

                                <div v-if="isView" class="col-md-3 col-12 q-mb-none">
                                    <p class="font-16 require font-medium text-grey-9">คู่สมรส</p>
                                    <div class="font-14 font-regular text-grey-9">
                                        {{ fullNameSpouse || '-' }}
                                    </div>
                                </div>

                                <div v-if="isView" class="col-md-3 col-12 q-mb-none">
                                    <p class="font-16 require font-medium text-grey-9">จดทะเบียนสมรส</p>
                                    <div class="font-14 font-regular text-grey-9">
                                        {{ selectedMarryLabel || '-' }}
                                    </div>
                                </div>

                                <div v-if="isView" class="col-md-3 col-12 q-mb-none">
                                    <p class="font-16 require font-medium text-grey-9 ">ประเภทบุคลากรคู่สมรส</p>
                                    <div class="font-14 font-regular text-grey-9">
                                        {{ selectedRoleLabel }}
                                    </div>
                                </div>
                            </div>

                        </q-card-section>

                        <!-- User information request section -->
                        <q-card-section v-if="!isView" class="q-pt-none">
                            <p v-if="!isView" class="font-16 font-medium q-mb-none">ข้อมูลผู้เบิก</p>
                            <div class="row q-py-md">
                                <div v-if="!isView" class="col-lg-4 col-12 q-mr-lg-xl q-mr-sm-none q-pl-sm">
                                    <InputGroup for-id="parentalStatus" more-class="font-16 font-medium text-grey-9"
                                        label="สถานะที่มีต่อบุตร" is-require clearable
                                        :data="model.parentalStatus ?? '-'" :is-view="isView">
                                        <q-select hide-bottom-space
                                            popup-content-class="font-14 font-regular text-grey-9"
                                            v-model="model.parentalStatus" is-dense :loading="isLoading"
                                            id="selected-status" outlined :options="optionsparentalStatus" dense
                                            clearable option-value="value" emit-value map-options
                                            :error="!!isError?.parentalStatus" :error-message="isError?.parentalStatus"
                                            option-label="name"
                                            :rules="[(val) => !!val || 'กรุณาเลือกสถานะที่มีต่อบุตร']" lazy-rules>
                                        </q-select>
                                    </InputGroup>
                                </div>

                                <div v-if="!isView" class="col-lg-4 col-12 ">
                                    <InputGroup for-id="marriageRegistration"
                                        more-class="font-16 font-medium text-grey-9" label="จดทะเบียนสมรส" is-require
                                        clearable :data="model.marryRegis ?? '-'" :is-view="isView">
                                        <q-select hide-bottom-space
                                            popup-content-class="font-14 font-regular text-grey-9"
                                            v-model="model.marryRegis" is-dense :loading="isLoading"
                                            id="selected-status" outlined :options="optionsMarry" dense clearable
                                            option-value="value" emit-value map-options option-label="name"
                                            :error="!!isError?.marryRegis" :error-message="isError?.marryRegis"
                                            :rules="[(val) => !!val || 'กรุณาเลือกการจดทะเบียนสมรส']" lazy-rules>
                                        </q-select>
                                    </InputGroup>
                                </div>
                            </div>
                            <q-separator />
                        </q-card-section>

                        <!-- Spouse information request section -->
                        <q-card-section v-if="!isView && model.marryRegis === 'YES'" class="q-pt-none">
                            <p v-if="!isView" class="font-16 font-medium q-mb-none ">ข้อมูลคู่สมรส</p>
                            <div class="row q-py-md">
                                <div v-if="!isView" class="col-lg-4 col-12 q-mr-xl  q-pl-sm">
                                    <InputGroup for-id="prefix" is-dense :data="model.prefix ?? '-'" is-require
                                        label="คำนำหน้า" placeholder="" type="text" :is-view="isView">
                                        <q-select use-input hide-selected hide-bottom-space hide-dropdown-icon clearable
                                            new-value-mode="add-unique" fill-input input-debounce="0"
                                            popup-content-class="font-14 font-regular" class="font-14 font-regular"
                                            :loading="isLoading" id="selected-prefix" outlined v-model="model.prefix"
                                            :options="optionPrefix" dense map-options :error-message="isError?.prefix"
                                            :error="!!isError?.prefix">
                                            <template v-slot:no-option>
                                                <q-item>
                                                    <q-item-section class="text-grey font-14 font-regular">
                                                        ไม่มีตัวเลือก
                                                    </q-item-section>
                                                </q-item>
                                            </template>
                                        </q-select>
                                    </InputGroup>
                                </div>

                                <div v-if="!isView" class="col-lg-5 col-12">
                                    <InputGroup for-id="spouse" is-dense v-model="model.spouse"
                                        :data="model.spouse ?? '-'" is-require label="คู่สมรส" placeholder="ชื่อ-สกุล"
                                        type="text" class="font-16 font-regular" :is-view="isView"
                                        :error="!!isError?.spouse">
                                    </InputGroup>
                                </div>
                            </div>

                            <div class="q-mb-none font-14 q-gutter-md q-pb-md ">
                                <div>
                                    <q-radio v-model="model.role" val="ไม่เป็นข้าราชการประจำหรือลูกจ้างประจำ"
                                        label="ไม่เป็นข้าราชการประจำหรือลูกจ้างประจำ" class="font-16 font-regular" />
                                </div>

                                <div class="row q-col-gutter-y-md font-16 font-regular ">
                                    <q-radio v-model="model.role" val="ข้าราชการ" label="ข้าราชการ" />
                                    <div class="col-lg-4 col-12 row items-center ">
                                        <p class="q-mb-none q-mx-md col-md-1 col-12">ตำแหน่ง</p>
                                        <q-input for="officer-position" v-model="spouseData.officer.position" outlined
                                            dense :data="spouseData.officer.position ?? '-'"
                                            :disable="model.role !== 'ข้าราชการ'" class="col-md-8 col-12 q-mx-md"
                                            :is-view="isView" />
                                    </div>
                                    <div class="col-lg-4 col-12 row items-center q-col-gutter-y-md">
                                        <p class="q-mb-none q-mx-md q-mt-xs-md q-mt-lg-none col-md-1 col-12">สังกัด</p>
                                        <q-input for="officer-belongTo" v-model="spouseData.officer.department" outlined
                                            dense :data="spouseData.officer.department ?? '-'"
                                            :disable="model.role !== 'ข้าราชการ'" class="col-md-8 col-12 q-mx-md"
                                            :is-view="isView" />
                                    </div>
                                </div>

                                <div>
                                    <q-radio v-model="model.role" val="ลูกจ้างประจำ" label="ลูกจ้างประจำ"
                                        class="font-16 font-regular" />
                                </div>

                                <div class="row items-center q-col-gutter-y-md font-16 font-regular">
                                    <q-radio v-model="model.role" val="พนักงานหรือลูกจ้างในรัฐวิสาหกิจ"
                                        label="พนักงานหรือลูกจ้างในรัฐวิสาหกิจ / หน่วงานของทางราชการ ราชการส่วนท้องถิ่น กรุงเทพมหานคร องค์กรอิสระ องค์กรมหาชน หรือหน่วยงานอื่นใด" />

                                    <div class="col-lg-4 col-12 row items-center ">
                                        <p class="q-mb-none q-mx-md col-md-1 col-12">ตำแหน่ง</p>
                                        <q-input for="enterprises-position" v-model="spouseData.enterprises.position"
                                            outlined dense :data="spouseData.enterprises.position ?? '-'"
                                            :disable="model.role !== 'พนักงานหรือลูกจ้างในรัฐวิสาหกิจ'"
                                            class="col-md-8 col-12 q-mx-md" :is-view="isView" />
                                    </div>

                                    <div class="col-lg-4 col-12 row items-center q-col-gutter-y-md">
                                        <p class="q-mb-none q-mx-md q-mt-xs-md q-mt-lg-none col-md-1 col-12">สังกัด</p>
                                        <q-input for="enterprises-belongTo" v-model="spouseData.enterprises.department"
                                            outlined dense :data="spouseData.enterprises.department ?? '-'"
                                            :disable="model.role !== 'พนักงานหรือลูกจ้างในรัฐวิสาหกิจ'"
                                            class="col-md-8 col-12 q-mx-md" :is-view="isView" />
                                    </div>
                                </div>

                            </div>
                            <q-separator />
                        </q-card-section>

                        <!-- Rights exercise information request  section -->
                        <q-card-section v-if="!isView" class="q-pt-none">
                            <p v-if="!isView" class="font-16 font-medium q-mb-none">ข้อมูลการใช้สิทธิ</p>
                            <p v-if="!isView" class="require q-pt-lg q-mb-none">ขอใช้สิทธิ</p>
                            <div v-if="!isView" class="q-py-md ">
                                <div>
                                    <q-checkbox v-if="!isView" v-model="model.eligibleBenefits"
                                        label="(ก) สำหรับผู้ปฏิบัติงานที่เริ่มปฏิบัติงานตั้งแต่วันที่ 26 มีนาคม พ.ศ. 2561 หรือ ผู้ปฏิบัติงานที่ปฏิบัติงานก่อนประกาศนี้มีผลใช้บังคับและมีบุตรที่เริ่มเข้าศึกษาตั้งแต่ ปีการศึกษา 2561"
                                        color="primary" val="ก" class=" text-grey-9 items-start"
                                        :disable="model.eligibleBenefits.includes('ข')" :is-view="isView" />
                                </div>

                                <div> <q-checkbox v-if="!isView" v-model="model.eligibleBenefits"
                                        label="(ข) สำหรับผู้ปฏิบัติงานที่เริ่มปฏิบัติงานก่อนวันที่ 26 มีนาคม พ.ศ. 2561 หรือ ผู้ปฏิบัติงานที่ปฏิบัติงานก่อนประกาศนี้มีผลใช้บังคับ"
                                        color="primary" val="ข" class=" text-grey-9 items-start"
                                        :disable="model.eligibleBenefits.includes('ก')" :is-view="isView" />
                                </div>

                                <div> <q-checkbox v-if="!isView" v-model="model.eligibleSubSenefits"
                                        label="(ค) สำหรับผู้ปฏิบัติงานที่มีบุตร ที่เริ่มเข้าศึกษาในโรงเรียนสาธิต “พิบูลบำเพ็ญ” มหาวิทยาลัยบูรพา โดยเข้าศึกษาตั้งแต่ภาคปลายปีการศึกษา 2560 เป็นต้นไป"
                                        color="primary" val="ค" class=" text-grey-9 items-start" :is-view="isView" />
                                </div>
                            </div>
                            <q-separator />
                        </q-card-section>





                        <!-- is-views -->


                        <q-card-section v-if="isView">

                            <div v-if="isView" class="row q-py-md">
                                <div class="col-md-3">
                                    <p class="font-16 require font-medium text-grey-9 ">ขอรับเงินสวัสดิการ</p>
                                    <div v-if="isView">
                                        <p class="font-14 font-regular text-grey-9 text">
                                            {{ model.eligible || '-' }}
                                        </p>
                                    </div>
                                </div>

                                <div class="col-md-9">
                                    <p class="font-16 require font-medium text-grey-9 ">ขอใช้สิทธิ</p>
                                    <div v-if="isView">
                                        <p class="font-14 font-regular text-grey-9 text ">
                                            {{ selectedEligibleBenefits || '-' }}
                                        </p>
                                    </div>
                                </div>
                            </div>


                            <q-separator class="q-mb-md" />
                        </q-card-section>


                        <q-card-section class="q-pt-none">
                            <div class="row justify-between q-pb-sm font-18 font-bold">
                                <p class="q-mb-none">ข้อมูลบุตร</p>
                                <q-btn v-if="!isView" style="border-radius: 8px;" @click="addChildForm"
                                    class="q-mb-md bg-blue-10 text-white" icon="add">
                                    เพิ่ม</q-btn>
                            </div>
                            <q-card flat bordered class="full-height ">
                                <q-card-section class="q-px-md q-pt-md q-pb-none font-14 q-gutter-y-md">
                                    <div v-for="(child, index) in model.child" :key="index">
                                        <div class="row items-center justify-between">
                                            <p class="q-mb-lg font-18 font-bold ">{{ index + 1 }}.
                                            </p>
                                            <q-btn
                                                v-if="(index > 0 && !isView && !isLoading) ||
                                                    (isEdit && !isView && child?.id && !isLoading && model.child.length > 1)"
                                                color="red" @click="removeChildForm(index)" class="q-ml-md">ลบ</q-btn>
                                        </div>

                                        <div class="row q-mb-md">
                                            <div class="col-md-5 col-12 q-mr-xl">
                                                <InputGroup for-id="name" more-class="font-16 font-medium text-grey-9"
                                                    label="ชื่อ-นามสกุล" compclass="col-6" is-require clearable
                                                    :data="child.childName ?? '-'" :is-view="isView">
                                                    <q-select hide-bottom-space is-dense v-model="child.childName"
                                                        is-require :loading="isLoading" id="selected-status"
                                                        popup-content-class="font-14 font-regular"
                                                        class="font-14 font-regular" outlined
                                                        :options="availableChildOptions" dense clearable
                                                        option-value="name" emit-value map-options option-label="name"
                                                        :error="!!isError[index]?.childName"
                                                        :error-message="isError[index]?.childName"
                                                        :rules="[(val) => !!val || 'กรุณาเลือกชื่อบุตร']" lazy-rules>
                                                    </q-select>
                                                </InputGroup>
                                            </div>

                                            <div class="col-md-5 col-12 ">
                                                <InputGroup for-id="birthday" is-dense
                                                    v-model="formattedChildBirthDay[index].formattedBirthDay"
                                                    more-class="font-16 font-medium text-grey-9"
                                                    :data="formattedChildBirthDay[index].formattedBirthDay ?? '-'"
                                                    label="เกิดเมื่อ" placeholder="" type="text" :is-view="isView"
                                                    disable color="dark">
                                                </InputGroup>

                                            </div>
                                        </div>

                                        <div class="row q-mb-md">
                                            <div class="col-md-5 col-12 q-mr-xl">
                                                <InputGroup for-id="fatherNumberChilden" is-dense
                                                    v-model="child.childFatherNumber"
                                                    more-class="font-16 font-medium text-grey-9"
                                                    :data="child.childFatherNumber ?? '-'" is-require
                                                    label="บุตรลำดับที่ (ของบิดา)" placeholder="" type="number" class=""
                                                    :is-view="isView" :error="!!isError[index]?.childFatherNumber"
                                                    :error-message="isError[index]?.childFatherNumber"
                                                    :rules="[(val) => !!val || 'กรุณากรอกบุตรลำดับที (ของบิดา)']"
                                                    lazy-rules>
                                                </InputGroup>
                                            </div>

                                            <div class="col-md-5 col-12 ">
                                                <InputGroup for-id="motherNumberChilden" is-dense
                                                    v-model="child.childMotherNumber"
                                                    more-class="font-16 font-medium text-grey-9"
                                                    :data="child.childMotherNumber ?? '-'" is-require
                                                    label="บุตรลำดับที่ (ของมารดา)" placeholder="" type="number"
                                                    class="" :is-view="isView"
                                                    :error="!!isError[index]?.childMotherNumber"
                                                    :error-message="isError[index]?.childMotherNumber"
                                                    :rules="[(val) => !!val || 'กรุณากรอกบุตรลำดับที่ (ของมารดา)']"
                                                    lazy-rules>
                                                </InputGroup>
                                            </div>
                                        </div>
                                        <div v-if="child.childPassedAway" class="q-py-md full-width q-mb-sm">
                                            <q-separator v-if="child.childPassedAway" />
                                        </div>

                                        <div v-if="isView">

                                        </div>

                                        <div v-else class="row q-pl-none items-center q-mb-md">
                                            <q-checkbox v-model="child.childPassedAway" color="green-6 q-pl-none" />
                                            <p class="q-mb-none font-16 font-medium text-grey-9">
                                                กรณีเป็นบุตรแทนที่บุตรซึ่งถึงแก่กรรมแล้ว
                                            </p>
                                        </div>

                                        <div v-if="child.childPassedAway">
                                            <div class="row q-mb-md">
                                                <div class="col-md-5 col-12 q-mr-xl">
                                                    <InputGroup for-id="delegateNumber" is-dense
                                                        v-model="child.delegateNumber"
                                                        more-class="font-16 font-medium text-grey-9"
                                                        :data="child.delegateNumber ?? '-'" is-require
                                                        label="แทนที่บุตรลำดับที่" type="number" class="font-14"
                                                        :is-view="isView" placeholder=""
                                                        :error="!!isError[index]?.delegateNumber"
                                                        :error-message="isError[index]?.delegateNumber"
                                                        :rules="[(val) => !!val || 'กรุณากรอกแทนที่บุตรลำดับที่']"
                                                        lazy-rules />
                                                </div>

                                                <div class="col-md-5 col-12 ">
                                                    <InputGroup for-id="delegateName" is-dense
                                                        v-model="child.delegateName"
                                                        more-class="font-16 font-medium text-grey-9"
                                                        :data="child.delegateName ?? '-'" label="ชื่อ - นามสุกล"
                                                        placeholder="" type="text" :is-view="isView" disable
                                                        color="dark">
                                                    </InputGroup>
                                                </div>
                                            </div>

                                            <div class="row q-mb-md">
                                                <div class="col-12 col-md-5 q-mr-xl">
                                                    <InputGroup for-id="delegateBirthDay" is-dense
                                                        v-model="child.delegateBirthDay"
                                                        more-class="font-16 font-medium text-grey-9"
                                                        :data="child.delegateBirthDay ?? '-'" label="เกิดเมื่อ"
                                                        placeholder="" type="text" disable :is-view="isView"
                                                        color="dark">
                                                    </InputGroup>
                                                </div>

                                                <div class="col-12 col-md-5">
                                                    <InputGroup for-id="delegateDeathDay"
                                                        more-class="font-16 font-medium text-grey-9"
                                                        label="ถึงแก่กรรมเมื่อ" compclass="col-6 q-pr-none" clearable
                                                        :is-view="isView" :data="child.delegateDeathDay ?? '-'">
                                                        <DatePicker is-dense v-model:model="child.delegateDeathDay"
                                                            v-model:dateShow="child.delegateDeathDay"
                                                            for-id="start-date" :no-time="true"
                                                            :rules="[(val) => !!val || 'กรุณากรอก วัน/เดือน/ปี วันที่ถึงแก่กรรม']"
                                                            :error="!!isError[index]?.delegateDeathDay"
                                                            :error-message="isError[index]?.delegateDeathDay" />
                                                    </InputGroup>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="q-py-md full-width q-mb-sm">
                                            <q-separator />
                                        </div>

                                        <div class="row q-mb-md">

                                            <div class="col-md-5 col-12 q-mr-xl q-gutter-y-md">
                                                <p class="require q-mb-none font-16 font-medium text-grey-9">สถานศึกษา
                                                </p>

                                                <q-input v-if="isView" v-model="child.schoolName" for="general-school"
                                                    :data="child.schoolName ?? '-'" type="text"
                                                    class="col-md-5 col-12 no-border q-mt-none" :is-view="isView" />

                                                <div v-if="!isView" class="row">
                                                    <q-radio v-if="!isView" v-model="child.schoolType"
                                                        :data="child.schoolType ?? '-'" val="ทั่วไป"
                                                        label="โรงเรียนทั่วไป" class="col-md-5 col-12"
                                                        :disable="!model.eligibleBenefits.includes('ก') && !model.eligibleBenefits.includes('ข')" />

                                                    <q-input v-if="!isView" v-model="child.schoolNamegeneral" outlined
                                                        dense type="text" :data="child.schoolNamegeneral ?? '-'"
                                                        :disable="child.schoolType !== 'ทั่วไป'" class="col-md-6 col-12"
                                                        :error="!!isError[index]?.schoolNamegeneral"
                                                        :error-message="isError[index]?.schoolNamegeneral"
                                                        :rules="[(val) => !!val || 'กรุณากรอกชื่อสถานศึกษา']"
                                                        lazy-rules />

                                                </div>

                                                <div v-if="!isView" class="row">
                                                    <q-radio v-if="!isView" v-model="child.schoolType"
                                                        :data="child.schoolType ?? '-'" val="สาธิตพิบูลบําเพ็ญ"
                                                        label="โรงเรียนสาธิตพิบูลบําเพ็ญ" class="col-md-5 col-12"
                                                        :disable="!model.eligibleSubSenefits.includes('ค')" />

                                                    <q-select v-if="!isView" hide-bottom-space
                                                        popup-content-class="font-14 font-regular text-grey-9"
                                                        v-model="child.schoolNameDemonstration" is-dense
                                                        :loading="isLoading" id="selected-status"
                                                        :data="child.schoolNameDemonstration ?? '-'" outlined
                                                        class="col-md-6 col-12"
                                                        :disable="child.schoolType !== 'สาธิตพิบูลบําเพ็ญ'"
                                                        :options="optionSchoolType" dense clearable option-value="value"
                                                        emit-value map-options option-label="name"
                                                        :error="!!isError[index]?.schoolNameDemonstration"
                                                        :error-message="isError[index]?.schoolNameDemonstration"
                                                        :rules="[(val) => !!val || 'กรุณาเลือกหลักสูตรโรงเรียนสาธิตพิบูลบําเพ็ญ']"
                                                        lazy-rules>
                                                    </q-select>

                                                </div>
                                            </div>

                                            <div class="col-md-5 col-12 ">
                                                <InputGroup more-class="font-16 font-medium text-grey-9"
                                                    label="ระดับชั้นที่ศึกษา" is-require clearable
                                                    :data="child.subCategoriesName ?? '-'" :is-view="isView">
                                                    <q-select hide-bottom-space v-model="child.subCategoriesId"
                                                        :loading="isLoading" id="selected-status"
                                                        popup-content-class="font-14 font-regular"
                                                        class="font-14 font-regular" outlined
                                                        :options="child.subCategories || []" dense clearable
                                                        option-value="value" emit-value map-options option-label="label"
                                                        v-if="!isView" :error="!!isError[index]?.subCategoriesId"
                                                        :error-message="isError[index]?.subCategoriesId"
                                                        :rules="[(val) => !!val || 'กรุณาเลือกระดับชั้น']" lazy-rules>
                                                        <template v-slot:no-option>
                                                            <q-item>
                                                                <q-item-section class="text-grey font-14 font-regular">
                                                                    ไม่มีตัวเลือก </q-item-section>
                                                            </q-item>
                                                        </template>
                                                    </q-select>
                                                </InputGroup>
                                            </div>
                                        </div>

                                        <div class="row q-mb-md">

                                            <div class="col-md-5 col-12 q-mr-lg-xl q-mr-sm-none">
                                                <InputGroup for-id="province" is-dense :data="child.province ?? '-'"
                                                    is-require label="จังหวัด" placeholder="" type="text"
                                                    :is-view="isView">
                                                    <q-select hide-bottom-space @filter="filterFnProvince"
                                                        @filter-abort="abortFilterFn" use-input input-debounce="100"
                                                        clearable popup-content-class="font-14 font-regular"
                                                        class="font-14 font-regular" :loading="isLoading"
                                                        id="selected-province" outlined v-model="child.province"
                                                        :options="optionProvinceSelected" dense option-value="name_th"
                                                        emit-value map-options option-label="name_th"
                                                        :error="!!isError[index]?.province"
                                                        :error-message="isError[index]?.province"
                                                        :rules="[(val) => !!val || 'กรุณากรอกจังหวัด']" lazy-rules>
                                                        <template v-slot:no-option>
                                                            <q-item>
                                                                <q-item-section class="text-grey font-14 font-regular">
                                                                    ไม่มีตัวเลือก </q-item-section>
                                                            </q-item>
                                                        </template>
                                                    </q-select>
                                                </InputGroup>
                                            </div>

                                            <div class="col-md-5 col-12 ">
                                                <InputGroup for-id="district" is-dense :data="child.district ?? '-'"
                                                    more-class="font-16 font-medium text-grey-9" is-require
                                                    label="อำเภอ" placeholder="" type="text" class="" :is-view="isView"
                                                    :error="!!isError?.district">
                                                    <q-select hide-bottom-space
                                                        @filter="(val, update) => filterFnDistrict(val, update, index)"
                                                        @filter-abort="abortFilterFnDistrict" use-input
                                                        input-debounce="100" clearable
                                                        popup-content-class="font-14 font-regular"
                                                        class="font-14 font-regular" :loading="isLoading"
                                                        id="selected-district" outlined v-model="child.district"
                                                        :options="child.districtOptions" dense option-value="name_th"
                                                        emit-value map-options option-label="name_th"
                                                        :error="!!isError[index]?.district"
                                                        :error-message="isError[index]?.district"
                                                        :rules="[(val) => !!val || 'กรุณากรอกอำเภอ / เขต']" lazy-rules>
                                                        <template v-slot:no-option>
                                                            <q-item>
                                                                <q-item-section class="text-grey font-14 font-regular">
                                                                    ไม่มีตัวเลือก </q-item-section>
                                                            </q-item>
                                                        </template>
                                                    </q-select>
                                                </InputGroup>
                                            </div>

                                        </div>

                                        <div class="q-py-md full-width q-mb-sm">
                                            <q-separator />
                                        </div>

                                        <div class="row q-mb-md">
                                            <div class="col-md-5 col-12 q-mr-xl">
                                                <InputGroup for-id="fundReceipt" is-dense v-model="child.fundReceipt"
                                                    more-class="font-16 font-medium text-grey-9"
                                                    :data="child.fundReceipt ?? '-'" is-require
                                                    label="จำนวนเงินตามใบเสร็จ (บาท)" placeholder="" type="number"
                                                    class="" :is-view="isView" :error="!!isError[index]?.fundReceipt"
                                                    :error-message="isError[index]?.fundReceipt"
                                                    :rules="[(val) => !!val || 'กรุณากรอกจำนวนเงินตามใบเสร็จ']"
                                                    lazy-rules>
                                                </InputGroup>
                                            </div>

                                            <div class="col-md-5 col-12 ">
                                                <InputGroup for-id="fundOther" is-dense v-model="child.fundOther"
                                                    :data="child.fundOther ?? '-'"
                                                    more-class="font-16 font-medium text-grey-9"
                                                    label="เบิกจากหน่วยงานอื่นแล้ว เป็นจำนวนเงิน (บาท)" placeholder=""
                                                    type="number" class="" :is-view="isView">
                                                </InputGroup>
                                            </div>
                                        </div>

                                        <div class="row q-mb-md">
                                            <div class="col-md-5 col-12 q-mr-xl">
                                                <InputGroup for-id="fundReceipt" is-dense v-model="child.fundUniversity"
                                                    more-class="font-16 font-medium text-grey-9"
                                                    :data="child.fundUniversity ?? '-'" is-require
                                                    label="ขอเบิกจากสวัสดิการมหาวิทยาลัย 5(8) จำนวนเงิน (บาท)"
                                                    placeholder="" type="number" class="" :is-view="isView"
                                                    :error="!!isError[index]?.fundUniversity"
                                                    :error-message="isError[index]?.fundUniversity"
                                                    :rules="[(val) => !!val || 'กรุณากรอกจำนวนเงินตามเบิกจากสวัสดิการมหาวิทยาลัย 5(8)']"
                                                    lazy-rules>
                                                </InputGroup>
                                            </div>

                                            <div class="col-md-5 col-12 ">
                                                <InputGroup for-id="fundOther" is-dense
                                                    v-model="child.fundSubUniversity"
                                                    :data="child.fundSubUniversity ?? '-'"
                                                    more-class="font-16 font-medium text-grey-9" is-require
                                                    label="ขอเบิกจากสวัสดิการมหาวิทยาลัย 5(9),(10) จำนวนเงิน (บาท)"
                                                    placeholder="" type="number"
                                                    :disable="child.schoolType !== 'สาธิตพิบูลบําเพ็ญ'" class=""
                                                    :is-view="isView" :error="!!isError[index]?.fundSubUniversity"
                                                    :error-message="isError[index]?.fundSubUniversity"
                                                    :rules="[(val) => !!val || 'กรุณากรอกจำนวนเงินตามเบิกจากสวัสดิการมหาวิทยาลัย 5(9),(10)']"
                                                    lazy-rules>
                                                </InputGroup>
                                            </div>
                                        </div>

                                        <div class="row q-mb-md">
                                            <div class="col-md-5 col-12 q-mr-xl">
                                                <InputGroup for-id="fundUniversity" is-dense
                                                    v-model="child.fundSumRequest"
                                                    more-class="font-16 font-medium text-grey-9"
                                                    :data="child.fundSumRequest ?? '-'" is-require
                                                    label="รวมเป็นจำนวนเงิน (บาท)" placeholder="" type="text" class=""
                                                    :is-view="isView" :error-message="isError[index]?.fundSumRequest"
                                                    :error="!!isError[index]?.fundSumRequest" :disable="true">
                                                </InputGroup>
                                            </div>
                                        </div>
                                        <q-separator v-if="model.child.length > 1 && index < model.child.length - 1" />
                                    </div>

                                </q-card-section>
                            </q-card>

                        </q-card-section>
                    </q-card>
                </div>
                <div class="col-md-3 col-12">

                    <q-card flat bordered class="">
                        <q-card-section class="q-px-md q-pt-md q-pb-md font-18 font-bold">
                            <p class="q-mb-none">หลักฐานที่ต้องแนบ</p>
                        </q-card-section>
                        <q-separator />
                        <q-card-section
                            class="row wrap q-col-gutter-y-md q-px-md q-py-md font-medium font-16 text-grey-7">
                            <p class="col-12 q-mb-none font-bold text-black">มารดา (จด/ไม่จดทะเบียนสมรส)</p>
                            <p class="col-12 q-mb-none">1. ใบเสร็จรับเงินและประกาศค่าธรรมเนียมการศึกษา</p>
                            <p class="col-12 q-mb-none">2. สำเนาบัตรประจำตัวประชาชน (ผู้เบิก)</p>
                            <p class="col-12 q-mb-none">3. สำเนาสูติบัตร (บุตร)</p>
                            <p class="col-12 q-mb-none font-bold text-black">บิดา (จดทะเบียนสมรส)</p>
                            <p class="col-12 q-mb-none">1. ใบเสร็จรับเงินและประกาศค่าธรรมเนียมการศึกษา</p>
                            <p class="col-12 q-mb-none">2. สำเนาบัตรประจำตัวประชาชน (ผู้เบิก)</p>
                            <p class="col-12 q-mb-none">3. สำเนาสูติบัตร (บุตร)</p>
                            <p class="col-12 q-mb-none">4. สำเนาทะเบียนสมรส (ผู้เบิก)</p>
                            <p class="col-12 q-mb-none font-bold text-black">บิดา (ไม่จดทะเบียนสมรส)</p>
                            <p class="col-12 q-mb-none">1. ใบเสร็จรับเงินและประกาศค่าธรรมเนียมการศึกษา</p>
                            <p class="col-12 q-mb-none">2. สำเนาบัตรประจำตัวประชาชน (ผู้เบิก)</p>
                            <p class="col-12 q-mb-none">3. สำเนาสูติบัตร (บุตร)</p>
                            <p class="col-12 q-mb-none">4. สำเนาทะเบียนรับรองบุตร</p>
                        </q-card-section>
                    </q-card>

                    <!-- Evidence Upload/View Section -->
                    <q-card v-if="showEvidenceUpload" flat bordered class="q-mt-md">
                        <q-card-section class="q-px-md q-pt-md q-pb-md font-18 font-bold">
                            <p class="q-mb-none">อัปโหลดหลักฐาน</p>
                        </q-card-section>
                        <q-separator />
                        <q-card-section class="row wrap q-col-gutter-y-md font-medium font-16 text-grey-7">
                            <!-- 1. ใบเสร็จรับเงินฯ -->
                            <div class="col-12">
                                <div class="row items-center justify-between q-mb-xs">
                                    <span>1. ใบเสร็จรับเงินฯ</span>
                                    <div v-if="!isView">
                                        <input ref="fileReceiptInput" type="file" accept=".pdf,.jpg,.jpeg,.png" style="display: none" @change="handleFileChange($event, 'receipt')" />
                                        <q-btn v-if="!fileData.receipt.name && !model.fileReceipt" outline color="primary" size="sm" no-caps icon="upload" label="อัปโหลด"
                                            @click="$refs.fileReceiptInput.click()" />
                                        <div v-else class="row items-center q-gutter-x-sm">
                                            <q-chip removable color="blue-2" text-color="blue-9" @remove="removeFile('receipt')"
                                                :label="fileData.receipt.name || getFileName(model.fileReceipt)" class="q-ma-none" size="sm" />
                                            <q-btn flat dense round icon="visibility" color="primary" size="sm" @click="previewFile(fileData.receipt.file, model.fileReceipt)" title="ดูตัวอย่าง" />
                                            <q-btn v-if="model.fileReceipt" flat dense round icon="download" color="primary" size="sm" @click="downloadFile(model.fileReceipt)" title="ดาวน์โหลด" />
                                        </div>
                                    </div>
                                    <div v-else-if="isView && model.fileReceipt" class="row items-center q-gutter-x-sm">
                                        <q-chip color="blue-2" text-color="blue-9" :label="getFileName(model.fileReceipt)" class="q-ma-none" size="sm" />
                                        <q-btn flat dense round icon="visibility" color="primary" size="sm" @click="previewFile(null, model.fileReceipt)" title="ดูตัวอย่าง" />
                                        <q-btn flat dense round icon="download" color="primary" size="sm" @click="downloadFile(model.fileReceipt)" title="ดาวน์โหลด" />
                                    </div>
                                    <span v-else-if="isView && !model.fileReceipt" class="text-grey-5 font-14">ไม่มีไฟล์แนบ</span>
                                </div>
                            </div>

                            <!-- 2. สำเนาบัตรประชาชน -->
                            <div class="col-12">
                                <div class="row items-center justify-between q-mb-xs">
                                    <span>2. สำเนาบัตรประชาชน</span>
                                    <div v-if="!isView">
                                        <input ref="fileIdCardInput" type="file" accept=".pdf,.jpg,.jpeg,.png" style="display: none" @change="handleFileChange($event, 'id_card')" />
                                        <q-btn v-if="!fileData.id_card.name && !model.fileIdCard" outline color="primary" size="sm" no-caps icon="upload" label="อัปโหลด"
                                            @click="$refs.fileIdCardInput.click()" />
                                        <div v-else class="row items-center q-gutter-x-sm">
                                            <q-chip removable color="blue-2" text-color="blue-9" @remove="removeFile('id_card')"
                                                :label="fileData.id_card.name || getFileName(model.fileIdCard)" class="q-ma-none" size="sm" />
                                            <q-btn flat dense round icon="visibility" color="primary" size="sm" @click="previewFile(fileData.id_card.file, model.fileIdCard)" title="ดูตัวอย่าง" />
                                            <q-btn v-if="model.fileIdCard" flat dense round icon="download" color="primary" size="sm" @click="downloadFile(model.fileIdCard)" title="ดาวน์โหลด" />
                                        </div>
                                    </div>
                                    <div v-else-if="isView && model.fileIdCard" class="row items-center q-gutter-x-sm">
                                        <q-chip color="blue-2" text-color="blue-9" :label="getFileName(model.fileIdCard)" class="q-ma-none" size="sm" />
                                        <q-btn flat dense round icon="visibility" color="primary" size="sm" @click="previewFile(null, model.fileIdCard)" title="ดูตัวอย่าง" />
                                        <q-btn flat dense round icon="download" color="primary" size="sm" @click="downloadFile(model.fileIdCard)" title="ดาวน์โหลด" />
                                    </div>
                                    <span v-else-if="isView && !model.fileIdCard" class="text-grey-5 font-14">ไม่มีไฟล์แนบ</span>
                                </div>
                            </div>

                            <!-- 3. สำเนาสูติบัตร -->
                            <div class="col-12">
                                <div class="row items-center justify-between q-mb-xs">
                                    <span>3. สำเนาสูติบัตร</span>
                                    <div v-if="!isView">
                                        <input ref="fileBirthCertInput" type="file" accept=".pdf,.jpg,.jpeg,.png" style="display: none" @change="handleFileChange($event, 'birth_certificate')" />
                                        <q-btn v-if="!fileData.birth_certificate.name && !model.fileBirthCertificate" outline color="primary" size="sm" no-caps icon="upload" label="อัปโหลด"
                                            @click="$refs.fileBirthCertInput.click()" />
                                        <div v-else class="row items-center q-gutter-x-sm">
                                            <q-chip removable color="blue-2" text-color="blue-9" @remove="removeFile('birth_certificate')"
                                                :label="fileData.birth_certificate.name || getFileName(model.fileBirthCertificate)" class="q-ma-none" size="sm" />
                                            <q-btn flat dense round icon="visibility" color="primary" size="sm" @click="previewFile(fileData.birth_certificate.file, model.fileBirthCertificate)" title="ดูตัวอย่าง" />
                                            <q-btn v-if="model.fileBirthCertificate" flat dense round icon="download" color="primary" size="sm" @click="downloadFile(model.fileBirthCertificate)" title="ดาวน์โหลด" />
                                        </div>
                                    </div>
                                    <div v-else-if="isView && model.fileBirthCertificate" class="row items-center q-gutter-x-sm">
                                        <q-chip color="blue-2" text-color="blue-9" :label="getFileName(model.fileBirthCertificate)" class="q-ma-none" size="sm" />
                                        <q-btn flat dense round icon="visibility" color="primary" size="sm" @click="previewFile(null, model.fileBirthCertificate)" title="ดูตัวอย่าง" />
                                        <q-btn flat dense round icon="download" color="primary" size="sm" @click="downloadFile(model.fileBirthCertificate)" title="ดาวน์โหลด" />
                                    </div>
                                    <span v-else-if="isView && !model.fileBirthCertificate" class="text-grey-5 font-14">ไม่มีไฟล์แนบ</span>
                                </div>
                            </div>

                            <!-- 4. Conditional document (only for บิดา) -->
                            <div v-if="model.parentalStatus === 'บิดา'" class="col-12">
                                <div class="row items-center justify-between q-mb-xs">
                                    <span>4. {{ model.marryRegis === 'YES' ? 'สำเนาทะเบียนสมรส' : 'สำเนาทะเบียนรับรองบุตร' }}</span>
                                    <div v-if="!isView">
                                        <input ref="fileDocumentInput" type="file" accept=".pdf,.jpg,.jpeg,.png" style="display: none" @change="handleFileChange($event, 'document')" />
                                        <q-btn v-if="!fileData.document.name && !model.fileDocument" outline color="primary" size="sm" no-caps icon="upload" label="อัปโหลด"
                                            @click="$refs.fileDocumentInput.click()" />
                                        <div v-else class="row items-center q-gutter-x-sm">
                                            <q-chip removable color="blue-2" text-color="blue-9" @remove="removeFile('document')"
                                                :label="fileData.document.name || getFileName(model.fileDocument)" class="q-ma-none" size="sm" />
                                            <q-btn flat dense round icon="visibility" color="primary" size="sm" @click="previewFile(fileData.document.file, model.fileDocument)" title="ดูตัวอย่าง" />
                                            <q-btn v-if="model.fileDocument" flat dense round icon="download" color="primary" size="sm" @click="downloadFile(model.fileDocument)" title="ดาวน์โหลด" />
                                        </div>
                                    </div>
                                    <div v-else-if="isView && model.fileDocument" class="row items-center q-gutter-x-sm">
                                        <q-chip color="blue-2" text-color="blue-9" :label="getFileName(model.fileDocument)" class="q-ma-none" size="sm" />
                                        <q-btn flat dense round icon="visibility" color="primary" size="sm" @click="previewFile(null, model.fileDocument)" title="ดูตัวอย่าง" />
                                        <q-btn flat dense round icon="download" color="primary" size="sm" @click="downloadFile(model.fileDocument)" title="ดาวน์โหลด" />
                                    </div>
                                    <span v-else-if="isView && !model.fileDocument" class="text-grey-5 font-14">ไม่มีไฟล์แนบ</span>
                                </div>
                            </div>
                        </q-card-section>
                    </q-card>

                </div>
            </div>
        </template>
        <!--Action Slot -->
        <template v-slot:action>
            <div class="justify-end row q-py-xs font-medium q-gutter-lg">
                <q-btn id="button-back" class="text-white font-medium font-16 weight-8 q-px-lg" dense type="button"
                    style="background : #BFBFBF;" label="ย้อนกลับ" no-caps :to="{ name: 'welfare_management_list' }" />
                <q-btn :disable="validate" id="button-draft"
                    class="text-white font-medium bg-blue-9 text-white font-16 weight-8 q-px-lg" dense type="submit"
                    label="บันทึก" no-caps @click="submit()" v-if="!isView && !isLoading" />
                <q-btn id="button-approve" class="font-medium font-16 weight-8 text-white q-px-md" dense type="submit"
                    style="background-color: #E52020" label="ไม่อนุมัติ" no-caps @click="submit(4)"
                    v-if="!isView && !isLoading" />
                <q-btn :disable="validate" id="button-approve" class="font-medium font-16 weight-8 text-white q-px-md"
                    dense type="submit" style="background-color: #43a047" label="อนุมัติ" no-caps @click="submit(3)"
                    v-if="!isView && !isLoading" />
            </div>
        </template>
    </PageLayout>

    <!-- Preview Dialog -->
    <q-dialog v-model="showPreviewDialog" maximized>
        <q-card>
            <q-card-section class="row items-center q-pb-none">
                <div class="text-h6">{{ previewFileName }}</div>
                <q-space />
                <q-btn icon="close" flat round dense v-close-popup />
            </q-card-section>
            <q-card-section class="full-height q-pa-sm">
                <iframe v-if="previewType === 'pdf'" :src="previewUrl" style="width: 100%; height: calc(100vh - 80px);" frameborder="0" />
                <div v-else class="flex flex-center" style="height: calc(100vh - 80px);">
                    <img :src="previewUrl" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
                </div>
            </q-card-section>
        </q-card>
    </q-dialog>
</template>
<script setup>
import PageLayout from "src/layouts/PageLayout.vue";
import InputGroup from "src/components/InputGroup.vue";
import Swal from "sweetalert2";
import { Notify } from "quasar";
import { formatDateThaiSlash, formatDateSlash, formatDateServer } from "src/components/format";
import DatePicker from "src/components/DatePicker.vue";
import { ref, watch, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import userManagementService from "src/boot/service/userManagementService";
import reimbursementChildrenEducationService from "src/boot/service/reimbursementChildrenEducationService";
import data from 'src/components/api_province_with_amphure_tambon.json';
import { textStatusColor } from "src/components/status";
import welfareManagementService from "src/boot/service/welfareManagementService";
import exportService from "src/boot/service/exportService";
defineOptions({
    name: "childrenEduWelfareEdit",
});
const isLoading = ref(false);
const isError = ref({});
const isView = ref(false);
const isLoadings = ref(false);
const router = useRouter();

// File upload state
const fileData = ref({
    receipt: { name: null, file: null },
    id_card: { name: null, file: null },
    birth_certificate: { name: null, file: null },
    document: { name: null, file: null },
});
const showPreviewDialog = ref(false);
const previewUrl = ref('');
const previewType = ref('');
const previewFileName = ref('');

const showEvidenceUpload = computed(() => {
    return !!model.value.parentalStatus && !!model.value.marryRegis;
});

function getFileName(filePath) {
    if (!filePath) return '';
    return filePath.replace(/^\d+-/, '');
}

function getFileType(fileName) {
    if (!fileName) return '';
    const ext = fileName.split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'pdf';
    return 'image';
}

function handleFileChange(event, fileType) {
    const file = event.target.files[0];
    if (!file) return;
    fileData.value[fileType] = { name: file.name, file: file };
    event.target.value = '';
}

function removeFile(fileType) {
    fileData.value[fileType] = { name: null, file: null };
    const modelFieldMap = { receipt: 'fileReceipt', id_card: 'fileIdCard', birth_certificate: 'fileBirthCertificate', document: 'fileDocument' };
    model.value[modelFieldMap[fileType]] = null;
}

async function previewFile(localFile, serverFileName) {
    try {
        let blob;
        if (localFile) {
            blob = localFile;
        } else if (serverFileName) {
            const response = await reimbursementChildrenEducationService.getFile(serverFileName);
            blob = response.data;
        } else return;

        const url = URL.createObjectURL(blob);
        const type = getFileType(localFile ? localFile.name : serverFileName);
        previewUrl.value = url;
        previewType.value = type;
        previewFileName.value = localFile ? localFile.name : getFileName(serverFileName);
        showPreviewDialog.value = true;
    } catch {
        Notify.create({ message: 'ไม่สามารถดูตัวอย่างไฟล์ได้', position: 'bottom-left', type: 'negative' });
    }
}

async function downloadFile(serverFileName) {
    try {
        const response = await reimbursementChildrenEducationService.getFile(serverFileName);
        const url = URL.createObjectURL(response.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = getFileName(serverFileName);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch {
        Notify.create({ message: 'ไม่สามารถดาวน์โหลดไฟล์ได้', position: 'bottom-left', type: 'negative' });
    }
}

async function uploadFiles(recordId) {
    const formData = new FormData();
    const fieldMap = { receipt: 'fileReceipt', id_card: 'fileIdCard', birth_certificate: 'fileBirthCertificate', document: 'fileDocument' };
    let hasFiles = false;
    for (const [key, formField] of Object.entries(fieldMap)) {
        if (fileData.value[key]?.file) {
            formData.append(formField, fileData.value[key].file);
            hasFiles = true;
        }
    }
    if (hasFiles) {
        await reimbursementChildrenEducationService.uploadFile(recordId, formData);
    }
}
const userInitialData = ref([]);
const route = useRoute();
let isAddingChild = false;
let isRemoveChild = false;
const userData = ref({});
const remaining = ref({});
const totalCount = ref({});
const shcoolData = ref([]);
let optionsUserName = ref([]);
let optionsChildName = ref([]);
let optionsSubCategory = ref([]);
const optionProvinceSelected = ref([]);
const optionPrefix = ref(['นาย', 'นาง', 'นางสาว'])
const isEdit = computed(() => {
    return !isNaN(route.params.id);
});

onMounted(async () => {
    await init();
    isLoadings.value = false;
});

onBeforeUnmount(() => {
    model.value = null;
});
const optionsProvince = computed(() => {
    if (!isView.value) return data;
    else return [];
});
function getDistrictByProvince(provinceName) {
    const findData = optionsProvince.value.find(p => p.name_th === provinceName);
    return findData ? findData.amphure : [];
}

const model = ref({
    createFor: null,
    prefix: null,
    fundSumReceipt: 0,
    fundEligible: 0,
    spouse: null,
    marryRegis: null,
    parentalStatus: null,
    role: null,
    eligible: "ตามสิทธิ",
    eligibleBenefits: [],
    eligibleSubSenefits: [],
    categoriesId: [],
    fileReceipt: null,
    fileIdCard: null,
    fileBirthCertificate: null,
    fileDocument: null,
    deleteChild: [
        {
            id: null,
        }
    ],
    child: [
        {
            fundReceipt: null,
            fundEligible: 0,
            fundUniversity: null,
            fundSubUniversity: null,
            fundSumRequest: null,
            fundOther: null,
            childName: null,
            childNumber: 1,
            childBirthDay: null,
            childFatherNumber: null,
            childMotherNumber: null,
            schoolName: null,
            schoolNamegeneral: null,
            schoolNameDemonstration: null,
            schoolType: null,
            district: null,
            province: null,
            subCategoriesId: null,
            subCategoriesName: null,
            childPassedAway: false,
            delegateName: null,
            delegateNumber: null,
            delegateBirthDay: null,
            delegateDeathDay: null
        }
    ]
});

function addChildForm() {
    isAddingChild = true;
    model.value.child.push({
        fundReceipt: null,
        fundEligible: 0,
        fundUniversity: null,
        fundSubUniversity: null,
        fundSumRequest: null,
        fundOther: null,
        childName: null,
        childNumber: model.value.child.length + 1,
        childBirthDay: null,
        childFatherNumber: null,
        childMotherNumber: null,
        schoolNamegeneral: null,
        schoolNameDemonstration: null,
        schoolType: null,
        district: null,
        province: null,
        subCategoriesId: null,
        childPassedAway: false,
        delegateName: null,
        delegateNumber: null,
        delegateBirthDay: null,
        delegateDeathDay: null
    });
    nextTick(() => {
        isAddingChild = false; // รีเซ็ต flag หลังเพิ่มเสร็จ
    });
}


const spouseData = ref({
    officer: {
        position: null,
        department: null
    },
    enterprises: {
        position: null,
        department: null
    }
});


let optionsMarry = [
    { name: "จดทะเบียน", value: "YES" },
    { name: "ไม่จดทะเบียน", value: "NO" },

];

let optionSchoolType = [
    { name: "ปกติ", value: "สาธิตพิบูลบําเพ็ญ" },
    { name: "นานาชาติ", value: "สาธิตพิบูลบําเพ็ญ นานาชาติ" },
];

let optionsparentalStatus = [
    { name: "บิดา", value: "บิดา" },
    { name: "มารดา", value: "มารดา" },

];

const fullNameSpouse = computed(() =>
    model.value.spouse ? `${model.value.prefix} ${model.value.spouse}` : 'ไม่พบข้อมูล'
);


const selectedChildNames = computed(() => model.value.child.map(child => child.childName));

const availableChildOptions = computed(() => {
    return optionsChildName.value.filter(option => !selectedChildNames.value.includes(option.name));
});

async function downloadData() {
  const notify = Notify.create({
    message: "กรุณารอสักครู่ ระบบกำลังทำการดาวน์โหลด",
    position: "top-right",
    spinner: true,
    type: 'info',
  });
  try {
    const result = await exportService.childrenEnducation(route.params.id);
    let filename = null;
    const contentDisposition = result.headers["content-disposition"];
    if (contentDisposition) {
      const matches = contentDisposition.match(/filename="?([^"]+)"?/);
      if (matches && matches[1]) {
        filename = decodeURIComponent(matches[1]);
      }
    }

    const blob = new Blob([result.data], { type: "application/pdf" });

    const a = document.createElement("a");
    const url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
  catch (error) {
    console.log(error);
    Notify.create({
      message:
        error?.response?.data?.message ??
        "ดาวน์โหลดไม่สำเร็จกรุณาลองอีกครั้ง",
      position: "top-right",
      type: "primary",
    });
  }
  finally {
    notify();
  }
}


watch(
    () =>
        model.value.child?.map((child) => ({
            childName: child.childName?.trim().toLowerCase() || "",
            fundSum:
                (parseFloat(child.fundUniversity) || 0) + (parseFloat(child.fundSubUniversity) || 0),
            fundSumReceipt:
                (parseFloat(child.fundReceipt) || 0) - (parseFloat(child.fundOther) || 0),
        })) || [],
    async (newValues) => {
        // ตรวจสอบให้แน่ใจว่า isError.value มีขนาดเท่ากับ model.value.child
        if (model.value.child && isError.value.length !== model.value.child.length) {
            isError.value = model.value.child.map(() => ({ fundSumRequest: "" }));
        }

        newValues.forEach((newValue, index) => {
            const dataArray = (Array.isArray(remaining.value) ? remaining.value : []).filter(
                (r) => r.childName
            );

            const subCategoriesId = model.value.child[index]?.subCategoriesId;
            const item = dataArray.find(
                (r) => r.childName?.trim().toLowerCase() === newValue.childName &&
                    r.subCategoryId === subCategoriesId
            );

            const fundLimit = parseFloat(item?.fund || 0);
            const fundRemaining = parseFloat(item?.fundRemaining || 0);
            const fundSum = parseFloat(newValue.fundSum || 0);
            const perTime = parseFloat(item?.perTime || 0);


            if (!model.value.child[index]) {
                console.error(`model.value.child[${index}] is undefined`);
                return;
            }

            // ตรวจสอบว่า isError.value เป็นอาร์เรย์และมีข้อมูลที่ index นี้
            if (Array.isArray(isError.value) && isError.value[index]) {
                isError.value[index].fundSumRequest = ""; // เคลียร์ข้อความก่อนตรวจสอบ

                if (fundSum > newValue.fundSumReceipt) {
                    isError.value[index].fundSumRequest = "ยอดเงินขอเบิกเกินจำนวนเงินตามใบเสร็จ";
                }
                else if (item) {

                    if (fundSum > perTime) {
                        isError.value[index].fundSumRequest = `ยอดเงินขอเบิกสามารถเบิกได้ ${perTime.toFixed(2)} ต่อครั้ง`;
                    }
                    else if (fundSum > fundRemaining) {
                        isError.value[index].fundSumRequest = `ยอดเงินขอเบิกเกินจำนวนเงินคงเหลือ ${fundRemaining.toFixed(2)}`;
                    }
                    else if (fundSum > fundLimit) {
                        isError.value[index].fundSumRequest = `ยอดเงินขอเบิกเกินจำนวนเพดานเงินที่กำหนด ${fundLimit.toFixed(2)}`;
                    }
                    else {
                        model.value.child[index].fundSumRequest = fundSum.toFixed(2);
                    }
                } else {
                    model.value.child[index].fundSumRequest = fundSum.toFixed(2);
                }
            } else {
                console.warn(`isError.value[${index}] is undefined or isError.value is not an array`);
            }
        });

        await nextTick();
    },
    { deep: true }
);


async function fetchRemaining() {
    try {
        const subCategoriesId = model.value.child.map(child => child.subCategoriesId);

        // Loop ผ่าน subCategoriesId แต่ละตัวและทำการ request แยก
        for (const id of subCategoriesId) {
            const fetchRemainingData = await reimbursementChildrenEducationService.getRemaining({
                createFor: model.value.createFor,
                subCategoriesId: [id]  // ส่งแค่หนึ่ง subCategoriesId ต่อครั้ง
            });

            const returnedData = fetchRemainingData.data.datas;

            if (returnedData) {
                const dataArray = Object.values(returnedData);  // แปลงเป็น array
                remaining.value = dataArray.map(item => ({
                    childName: item.childName,
                    fund: item?.fund,
                    totalSumRequested: item?.totalSumRequested,
                    perTime: item?.perTime,
                    fundRemaining: item?.fundRemaining
                }));
            }
        }
    } catch (error) {
        console.error("❌ Error fetching remaining:", error);
    }
}

async function fetchTotalCountRequested() {
    try {
        const subCategoriesId = model.value.child.map(child => child.subCategoriesId);

        // Loop ผ่าน subCategoriesId แต่ละตัวและทำการ request แยก
        for (const id of subCategoriesId) {
            const fetchRemainingData = await reimbursementChildrenEducationService.getTotalCountRequested({
                createFor: model.value.createFor,
                subCategoriesId: [id]  // ส่งแค่หนึ่ง subCategoriesId ต่อครั้ง
            });

            const returnedData = fetchRemainingData.data.datas;

            if (returnedData) {
                const dataArray = Object.values(returnedData);  // แปลงเป็น array
                totalCount.value = dataArray.map(item => ({
                    subCategoryId: item.subCategoryId,
                    childName: item.childName,
                    fund: item?.fund,
                    totalSumRequested: item?.totalSumRequested,
                    perTime: item?.perTime,
                    fundRemaining: item?.fundRemaining
                }));
            }
        }
    } catch (error) {
        console.error("❌ Error fetching remaining:", error);
    }
}

watch(
    () => ({
        createFor: model.value.createFor,
        subCategoriesId: model.value.child.map(child => child.subCategoriesId)
    }),
    (newVal) => {
        if (newVal.subCategoriesId.length > 0) {
            fetchRemaining();
            fetchTotalCountRequested()
        }
    },
    { deep: true }
);


// ฟังก์ชันในการจัดการการแสดงผลข้อมูลเด็ก
const displayedChildren = computed(() => {
    const dataArray = Array.isArray(totalCount.value) ? totalCount.value : [];

    return optionsChildName.value.map((child, index) => {
        const childNameToCompare = child.name?.trim().toLowerCase();

        const foundChild = dataArray.find(r =>
            r.childName?.trim().toLowerCase() === childNameToCompare
        ) || null;

        const formattedTotalSum = foundChild && typeof foundChild.totalSumRequested === 'number'
            ? new Intl.NumberFormat('en-US').format(foundChild.totalSumRequested)
            : '-';

        return {
            index: index + 1,
            childName: child.childName || `บุตรคนที่ ${index + 1}`,
            fundRemaining: formattedTotalSum,
        };
    });
});

watch(
    () => model.value.child.map(child => child.delegateNumber),
    async (newDelegateNumbers) => {
        newDelegateNumbers.forEach((delegateNumber, index) => {
            if (delegateNumber != null && optionsChildName.value.length > 0) {
                const childIndex = delegateNumber - 1;
                const matchedChild = optionsChildName.value[childIndex];

                if (matchedChild) {
                    model.value.child[index].delegateName = matchedChild.name;
                    model.value.child[index].delegateBirthDay = isView.value === true ? formatDateThaiSlash(matchedChild.birthday) : formatDateSlash(matchedChild.birthday);

                }
            }
        });
    },
    { immediate: true }
);



async function fetchSchoolName() {
    let createForParam = model.value.createFor;
    try {
        const result = await welfareManagementService.getLastShcoolNameEditor({
            createFor: createForParam, // ส่งเฉพาะเมื่อ canCreateFor.value == true
        });

        if (result.data && Array.isArray(result.data.ChildInformation)) {
            shcoolData.value = result.data.ChildInformation;
        } else {
            console.warn("⚠️ ไม่มีข้อมูล schoolData หรือ ChildInformation ไม่ถูกต้อง", result.data);
        }
    } catch (error) {
        console.error("❌ Error fetching school data:", error);
    }
}
watch(() => model.value.createFor, (newVal) => {
    if (newVal) {
        fetchSchoolName();
    }
});

watch(
    () => ({
        eligibleBenefits: [...model.value.eligibleBenefits],
        eligibleSubSenefits: [...model.value.eligibleSubSenefits],
        children: model.value.child.map(child => ({
            name: child.childName,
            schoolType: child.schoolType,
            schoolName: child.schoolNamegeneral || child.schoolNameDemonstration,
        }))
    }),
    async ({ eligibleBenefits, eligibleSubSenefits, children }) => {

        if (!eligibleBenefits.length && !eligibleSubSenefits.length) {
            return;
        }

        const hasValidSchoolType = children.some(child => child.schoolType);
        if (!hasValidSchoolType) {
            return;
        }

        // ✅ รอ Vue อัปเดตค่าให้เสร็จก่อนเรียก API
        await nextTick();

        // ✅ หน่วงเวลาเล็กน้อยเพื่อตรวจสอบซ้ำ
        setTimeout(() => {
            if (!model.value.child.some(child => child.schoolType)) {
                return;
            }
            getSubCategory();
        }, 300);
    },
    { deep: true, immediate: true }
);

const getSubCategory = async () => {
    try {
        if (!Array.isArray(model.value.child) || model.value.child.length === 0) {
            return;
        }

        for (const child of model.value.child) {
            let categoriesId = null;

            if (model.value.eligibleBenefits.includes('ก') && child.schoolType === 'ทั่วไป') {
                categoriesId = 13;
            } else if (model.value.eligibleBenefits.includes('ข') && child.schoolType === 'ทั่วไป') {
                categoriesId = 14;
            } else if (model.value.eligibleBenefits.includes('ก') && model.value.eligibleSubSenefits.includes('ค') && child.schoolType === 'สาธิตพิบูลบําเพ็ญ' && child.schoolNameDemonstration === 'สาธิตพิบูลบําเพ็ญ') {
                categoriesId = 15;
            } else if (model.value.eligibleBenefits.includes('ข') && model.value.eligibleSubSenefits.includes('ค') && child.schoolType === 'สาธิตพิบูลบําเพ็ญ' && child.schoolNameDemonstration === 'สาธิตพิบูลบําเพ็ญ') {
                categoriesId = 16;
            } else if (model.value.eligibleBenefits.includes('ก') && model.value.eligibleSubSenefits.includes('ค') && child.schoolType === 'สาธิตพิบูลบําเพ็ญ' && child.schoolNameDemonstration === 'สาธิตพิบูลบําเพ็ญ นานาชาติ') {
                categoriesId = 17;
            } else if (model.value.eligibleBenefits.includes('ข') && model.value.eligibleSubSenefits.includes('ค') && child.schoolType === 'สาธิตพิบูลบําเพ็ญ' && child.schoolNameDemonstration === 'สาธิตพิบูลบําเพ็ญ นานาชาติ') {
                categoriesId = 18;
            }

            if (!categoriesId) {
                child.subCategories = [];
                continue;
            }

            const result = await reimbursementChildrenEducationService.getSubCategories({
                categories_id: categoriesId
            });


            // เก็บค่า subCategories ไว้ในตัวเด็ก
            child.subCategories = result.data.map(item => ({
                value: item.id,
                label: item.name
            }));
        }
    } catch (error) {
        const errorMessage = error?.response?.data?.message ?? "กรุณาเลือกสิทธิ";
        alert(errorMessage);
    }
};

async function fetchUserData(id) {
    try {
        const result = await userManagementService.dataById(id);
        var returnedData = result.data.datas;

        if (returnedData) {
            userData.value = {
                name: returnedData?.name,
                position: returnedData?.position?.name,
                employeeType: returnedData?.employeeType?.name,
                sector: returnedData?.sector?.name,
                department: returnedData?.department?.name
            };

            optionsChildName.value = returnedData.children || [];
        } else {
            console.warn("⚠️ ไม่มีข้อมูล userData");
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
    }
}
const formattedChildBirthDay = computed(() => {
    return model.value.child.map(child => ({
        ...child,
        formattedBirthDay: child.childBirthDay
            ? isView.value === true ? formatDateThaiSlash(child.childBirthDay) : formatDateSlash(child.childBirthDay)
            : "",
    }));
});



watch(
    () => model.value.child.map(child => child.childName),
    async (newNames) => {
        newNames.forEach((newName, index) => {
            if (newName) {
                const selectedChild = optionsChildName.value.find(
                    (child) => child.name === newName
                );

                if (selectedChild) {
                    model.value.child[index].childBirthDay = selectedChild.birthday;
                }
            } else {
                // เคลียร์ค่าถ้าชื่อถูกลบ
                model.value.child[index].childBirthDay = "";
            }
        });

        await nextTick(); // 🔥 บังคับ Vue อัปเดต UI
    },
    { deep: true }
);

async function filterFnProvince(val, update) {
    try {
        setTimeout(async () => {

            update(() => {
                if (val === '') {
                    optionProvinceSelected.value = optionsProvince.value;
                }
                else {
                    optionProvinceSelected.value = optionsProvince.value.filter(v => v.name_th.includes(val));
                }
            });
        }, 650);

    }
    catch (error) {
        Promise.reject(error);
    }
}
async function filterFnDistrict(val, update, index) {
    try {
        setTimeout(() => {
            const provinceName = model.value.child[index].province;
            const districts = getDistrictByProvince(provinceName);

            update(() => {
                if (val === '') {
                    model.value.child[index].districtOptions = districts;
                } else {
                    model.value.child[index].districtOptions = districts.filter(d => d.name_th.includes(val));
                }
            });
        }, 650);
    } catch (error) {
        console.error(error);
    }
}
function abortFilterFnDistrict() {
    // console.log('delayed filter aborted')
}

function abortFilterFn() {
    // console.log('delayed filter aborted')
}

watch(() => model.value.categoriesId, (newValue) => {
    if (newValue) {
        getSubCategory(); // เรียกฟังก์ชัน getSubCategory เมื่อ categories_id เปลี่ยน
    }
});

async function fetchDataEdit() {
    setTimeout(async () => {
        try {
            const result = await welfareManagementService.dataChildrenById(route.params.id);
            const returnedData = result.data.datas;

            if (returnedData) {
                let prefix = null;
                let name = returnedData?.spouse ?? "-";

                const spouseParts = returnedData.spouse.split(' ');
                prefix = spouseParts[0] ?? null;
                name = spouseParts.slice(1).join(' ') || null;
                model.value = {
                    ...model.value,
                    createFor: returnedData?.user?.userId ?? null,
                    reimNumber: returnedData?.reimNumber ?? "-",
                    requestDate: returnedData?.requestDate ?? "-",
                    status: returnedData?.status ?? "-",
                    prefix: prefix,
                    spouse: name,
                    eligible: returnedData?.eligible ?? null,
                    marryRegis: returnedData?.marryRegis ?? null,
                    parentalStatus: returnedData?.parentalStatus ?? null,
                    role: returnedData?.role ?? null,
                    position: returnedData?.position ?? "-",
                    department: returnedData?.department ?? "-",
                    categoriesId: returnedData?.category?.id ?? null,
                    fileReceipt: returnedData?.fileReceipt ?? null,
                    fileIdCard: returnedData?.fileIdCard ?? null,
                    fileBirthCertificate: returnedData?.fileBirthCertificate ?? null,
                    fileDocument: returnedData?.fileDocument ?? null,
                    child: Array.isArray(returnedData?.children)
                        ? returnedData.children.map(child => ({
                            ...child,
                            schoolType: child.schoolType ?? "-",
                            schoolName: child.schoolName ?? "-",
                            schoolNamegeneral: child.schoolType === "ทั่วไป" ? child.schoolName : null,
                            schoolNameDemonstration: child.schoolType === "สาธิตพิบูลบําเพ็ญ" ? child.schoolName : null,
                            childBirthDay: child.childBirthDay ?? "-",
                            subCategoriesName: child.sub_category?.name ?? null,
                            subCategoriesId: child.sub_category?.id ?? null, // ✅ ใช้ subCategoriesId แทน subCategoryName
                            childPassedAway: child.childType === "DELEGATE",
                            delegateBirthDay: isView.value === true ? formatDateThaiSlash(child.delegateBirthDay) : formatDateSlash(child.delegateBirthDay),
                            delegateDeathDay: isView.value === true ? formatDateThaiSlash(child.delegateDeathDay) : formatDateSlash(child.delegateDeathDay)
                        }))
                        : []
                };
                userData.value = {
                    userId: returnedData?.userId ?? null,
                    name: returnedData?.name ?? "-",
                    position: returnedData?.positionUser ?? "-", // ใช้ positionUser แทน position
                    employeeType: returnedData?.employeeType ?? "-",
                    sector: returnedData?.sector ?? "-",
                    department: returnedData?.departmentUser ?? "-", // ใช้ departmentUser แทน department
                };

                spouseData.value = {
                    officer: {
                        position: returnedData?.role === "ข้าราชการ" ? returnedData?.position ?? "-" : null,
                        department: returnedData?.role === "ข้าราชการ" ? returnedData?.department ?? "-" : null,
                    },
                    enterprises: {
                        position: returnedData?.role === "พนักงานหรือลูกจ้างในรัฐวิสาหกิจ" ? returnedData?.department ?? "-" : null,
                        department: returnedData?.role === "พนักงานหรือลูกจ้างในรัฐวิสาหกิจ" ? returnedData?.department ?? "-" : null,
                    }
                };


                model.value.eligibleBenefits.push(returnedData?.eligibleBenefits);
                model.value.eligibleSubSenefits.push(returnedData?.eligibleSubSenefits);
            }

        } catch (error) {
            Notify.create({
                message: error?.response?.data?.message ?? "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง",
                position: "bottom-left",
                type: "negative",
            });
        }
        isLoading.value = false;
    }, 100);
}

function removeChildForm(index) {
    isRemoveChild = true;
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
                    model.value.deleteChild = [];
                }
                model.value.deleteChild.push({ id: model.value.child[index].id });
            }
            model.value.child.splice(index, 1);

            if (model.value.child.length === 0) {
                addChildForm();
            }
        }

        // ✅ ย้ายมาตรงนี้ เพื่อให้ reset หลังจาก Swal เสร็จแล้วเท่านั้น
        nextTick(() => {
            isRemoveChild = false;
        });
    });
}

let loadRole = true;
watch(
    () => model.value.role,
    async () => {
        if (loadRole) {
            loadRole = false
            return;
        }

        // Preserve reactivity by updating properties instead of reassigning
        spouseData.value.officer.position = null;
        spouseData.value.officer.department = null;
        spouseData.value.enterprises.position = null;
        spouseData.value.enterprises.department = null;
    },

);


watch(
    () => model.value.marryRegis,
    async (newValue) => {
        if (newValue === 'NO') {
            model.value.prefix = null;
            model.value.spouse = null;
            model.value.role = null;
            spouseData.value = {
                officer: {
                    position: null,
                    department: null
                },
                enterprises: {
                    position: null,
                    department: null
                }
            };
        }
    },
    { deep: true, immediate: true }
);



let isFirstLoad = true;  // ตัวแปรเก็บสถานะการโหลดครั้งแรก
let isSettingFromChildName = false;

watch(
    () => model.value.child.map((child) => child.schoolType),
    async (newSchoolTypes, oldSchoolTypes) => {
        if (isFirstLoad) {
            isFirstLoad = false;
            return;
        }

        if (isSettingFromChildName) return;

        if (!oldSchoolTypes || JSON.stringify(newSchoolTypes) === JSON.stringify(oldSchoolTypes)) {
            return;
        }

        newSchoolTypes.forEach((newSchoolType, index) => {
            if (newSchoolType !== oldSchoolTypes[index]) {
                model.value.child[index].schoolNameDemonstration = null;
                model.value.child[index].schoolNamegeneral = null;
                model.value.child[index].subCategoriesId = null;
                model.value.child[index].fundSubUniversity = null;
                optionsSubCategory.value = []
            }
        });
    }
);

watch(
    () => model.value.child.map(child => child.childName),
    async (newNames) => {
        isSettingFromChildName = true;

        newNames.forEach((newName, index) => {
            if (newName) {
                if (Array.isArray(shcoolData.value)) {
                    const selectedChild = shcoolData.value.find(
                        (child) => child.childName === newName
                    );

                    if (selectedChild) {
                        model.value.child[index].schoolType = selectedChild.schoolType || " ";

                        const schoolName = (selectedChild.schoolName || "").trim();

                        if (selectedChild.schoolType === 'ทั่วไป') {
                            model.value.child[index].schoolNamegeneral = schoolName || " ";
                            model.value.child[index].schoolNameDemonstration = null;
                        } else {
                            model.value.child[index].schoolNamegeneral = null;
                            model.value.child[index].schoolNameDemonstration = ['สาธิตพิบูลบําเพ็ญ', 'สาธิตพิบูลบําเพ็ญ นานาชาติ'].includes(schoolName)
                                ? schoolName
                                : '';
                        }
                    }
                } else {
                    console.warn("⚠️ shcoolData.value ไม่เป็นอาร์เรย์:", shcoolData.value);
                }
            } else {
                if (isAddingChild || isRemoveChild) {
                    return;
                }
                model.value.child[index].schoolNameDemonstration = "";
                model.value.child[index].schoolNamegeneral = "";
                model.value.child[index].schoolType = "";
            }
        });

        await nextTick();
        isSettingFromChildName = false;
    },
    { deep: true }
);

watch(
    () => model.value.createFor,
    async (newValue) => {
        if (newValue != null) {
            await fetchRemaining();
        }
    }
);

watch(
    () => userData.value.userId,
    async (newValue) => {
        if (newValue != null) {
            await fetchUserData(userData.value.userId);
        }
    }
);

const benefitsOptions = [
    { label: "(ก) สำหรับผู้ปฏิบัติงานที่เริ่มปฏิบัติงานตั้งแต่วันที่ 26 มีนาคม พ.ศ. 2561 หรือ ผู้ปฏิบัติงานที่ปฏิบัติงานก่อนประกาศนี้มีผลใช้บังคับและมีบุตรที่เริ่มเข้าศึกษาตั้งแต่ ปีการศึกษา 2561", value: "ก" },
    { label: "(ข) สำหรับผู้ปฏิบัติงานที่เริ่มปฏิบัติงานก่อนวันที่ 26 มีนาคม พ.ศ. 2561 หรือ ผู้ปฏิบัติงานที่ปฏิบัติงานก่อนประกาศนี้มีผลใช้บังคับ", value: "ข" }
];

const subBenefitsOptions = [
    { label: "(ค) สำหรับผู้ปฏิบัติงานที่มีบุตร ที่เริ่มเข้าศึกษาในโรงเรียนสาธิต “พิบูลบำเพ็ญ” มหาวิทยาลัยบูรพา โดยเข้าศึกษาตั้งแต่ภาคปลายปีการศึกษา 2560 เป็นต้นไป", value: "ค" }
];


const selectedEligibleBenefits = computed(() => {
    const selectedBenefits = benefitsOptions.find(opt => opt.value === model.value.eligibleBenefits[0]);
    const selectedSubBenefits = subBenefitsOptions.find(opt => opt.value === model.value.eligibleSubSenefits[0]);
    if (selectedBenefits && selectedSubBenefits) {
        return `${selectedBenefits.label}\n${selectedSubBenefits.label}`;
    }
    else if (selectedBenefits && !selectedSubBenefits) {
        return selectedBenefits.label;
    }
    else if (!selectedBenefits && selectedSubBenefits) {
        return selectedSubBenefits.label;
    }
    return "ไม่พบข้อมูล";
});


const selectedMarryLabel = computed(() => {
    if (!model.value.marryRegis) return "ไม่พบข้อมูล"; // ✅ ตรวจสอบค่าก่อน

    const selectedOption = optionsMarry.find(opt => opt.value === model.value.marryRegis);
    return selectedOption ? selectedOption.name : "ไม่พบข้อมูล";
});

const selectedparentalStatusLabel = computed(() => {
    if (!model.value.parentalStatus) return "ไม่พบข้อมูล"; // ✅ ตรวจสอบค่าก่อน

    const selectedOption = optionsparentalStatus.find(opt => opt.value === model.value.parentalStatus);
    return selectedOption ? selectedOption.name : "ไม่พบข้อมูล";
});

const selectedRoleLabel = computed(() => {
    if (!model.value.role) return "ไม่พบข้อมูล"; // กรณีไม่มีค่า role

    switch (model.value.role) {
        case "ข้าราชการ":
            return `ข้าราชการ (ตำแหน่ง: ${model.value.position || "-"}, สังกัด: ${model.value.department || "-"})`;

        case "พนักงานหรือลูกจ้างในรัฐวิสาหกิจ":
            return `พนักงานรัฐวิสาหกิจ (ตำแหน่ง: ${model.value.position || "-"}, สังกัด: ${model.value.department || "-"})`;

        default:
            return model.value.role; // ใช้ค่า role ตรงๆ ถ้าไม่ใช่เคสพิเศษ
    }
});


let validate = ref(false);

watch(model, (newValue) => {
    validateForm(newValue);
}, { deep: true });

const validateForm = (modelValue) => {
    validate.value = false;
    isError.value = {}; // Reset errors

    if (!modelValue.spouse && modelValue.marryRegis === 'YES') {
        isError.value.spouse = "กรุณากรอกชื่อคู่สมรส";
        validate.value = true;
    }
    if (!modelValue.parentalStatus) {
        isError.value.parentalStatus = "กรุณาเลือกสถานะที่มีต่อบุตร";
        validate.value = true;
    }
    if (!modelValue.marryRegis) {
        isError.value.marryRegis = "กรุณาเลือกการจดทะเบียนสมรส";
        validate.value = true;
    }
    if (!modelValue.role && modelValue.marryRegis === 'YES') {
        isError.value.role = "กรุณาเลือกประเภทคู่สมรส";
        validate.value = true;
    }

    if (modelValue.child && modelValue.child.length > 0) {
        modelValue.child.forEach((c, index) => {
            isError.value[index] = {};

            if (!c.fundReceipt) {
                isError.value[index].fundReceipt = "กรุณากรอกจำนวนเงินตามใบเสร็จ";
                validate.value = true;
            }
            if (!c.fundUniversity) {
                isError.value[index].fundUniversity = "กรุณากรอกจำนวนเงินเบิกจากสวัสดิการมหาวิทยาลัย 5(8)";
                validate.value = true;
            }
            if (!c.fundSubUniversity && c.schoolType === 'สาธิตพิบูลบำเพ็ญ') {
                isError.value[index].fundSubUniversity = "กรุณากรอกจำนวนเงินเบิกจากสวัสดิการมหาวิทยาลัย 5(9), 5(10)";
                validate.value = true;
            }
            if (!c.childName) {
                isError.value[index].childName = "กรุณาเลือกชื่อ-นามสกุลของบุตร";
                validate.value = true;
            }
            if (!c.childFatherNumber) {
                isError.value[index].childFatherNumber = "กรุณากรอกลำดับบุตรของบิดา";
                validate.value = true;
            }
            if (!c.childMotherNumber) {
                isError.value[index].childMotherNumber = "กรุณากรอกลำดับบุตรของมารดา";
                validate.value = true;
            }
            if (!c.schoolNamegeneral && c.schoolType === 'ทั่วไป') {
                isError.value[index].schoolNamegeneral = "กรุณากรอกชื่อสถาบันศึกษาทั่วไป";
                validate.value = true;
            }
            if (!c.schoolNameDemonstration && c.schoolType === 'สาธิตพิบูลบำเพ็ญ') {
                isError.value[index].schoolNameDemonstration = "กรุณาเลือกชื่อสถาบันศึกษา";
                validate.value = true;
            }
            if (!c.district) {
                isError.value[index].district = "กรุณากรอกอำเภอ";
                validate.value = true;
            }
            if (!c.province) {
                isError.value[index].province = "กรุณากรอกจังหวัด";
                validate.value = true;
            }
            if (!c.subCategoriesId) {
                isError.value[index].subCategoriesId = "กรุณาเลือกกระดับชั้นที่ศึกษา";
                validate.value = true;
            }

            if (c.childPassedAway) {
                if (!c.delegateNumber) {
                    isError.value[index].delegateNumber = "กรุณาเลือกลำดับบุตรแทนที่";
                    validate.value = true;
                }
                if (!c.delegateDeathDay) {
                    isError.value[index].delegateDeathDay = "กรุณาเลือกวันที่ถึงแก่กรรม";
                    validate.value = true;
                }
            }
        });
    }
};

async function submit(actionId) {
    let validate = false;

    if (!model.value.spouse && model.value.marryRegis === 'YES') {
        isError.value.spouse = "กรุณากรอกชื่อคู่สมรส";
        validate = true;
    }
    if (!model.value.parentalStatus) {
        isError.value.parentalStatus = "กรุณาเลือกสถานะที่มีต่อบุตร";
        validate = true;
    }
    if (!model.value.marryRegis) {
        isError.value.marryRegis = "กรุณาเลือกการจดทะเบียนสมรส";
        validate = true;
    }

    if (!model.value.role && model.value.marryRegis === 'YES') {
        isError.value.role = "กรุณาเลือกประเภทคู่สมรส";
        validate = true;
    }

    if (model.value.child && model.value.child.length > 0) {
        model.value.child.map((c, index) => {
            isError.value[index] = {}; // สร้างออบเจ็กต์ isError สำหรับแต่ละคน

            if (!c.fundReceipt) {
                isError.value[index].fundReceipt = "กรุณากรอกจำนวนเงินตามใบเสร็จ";
                validate = true;
            }
            if (!c.fundUniversity) {
                isError.value[index].fundUniversity = "กรุณากรอกจำนวนเงินเบิกจากสวัสดิการมหาวิทยาลัย 5(8)";
                validate = true;
            }
            if (!c.fundSubUniversity && c.schoolType === 'สาธิตพิบูลบำเพ็ญ') {
                isError.value[index].fundSubUniversity = "กรุณากรอกจำนวนเงินเบิกจากสวัสดิการมหาวิทยาลัย 5(9), 5(10)";
                validate = true;
            }
            if (!c.childName) {
                isError.value[index].childName = "กรุณาเลือกชื่อ-นามสกุลของบุตร";
                validate = true;
            }
            if (!c.childFatherNumber) {
                isError.value[index].childFatherNumber = "กรุณากรอกลำดับบุตรของบิดา";
                validate = true;
            }
            if (!c.childMotherNumber) {
                isError.value[index].childMotherNumber = "กรุณากรอกลำดับบุตรของมารดา";
                validate = true;
            }
            if (!c.schoolNamegeneral && c.schoolType === 'ทั่วไป') {
                isError.value[index].schoolNamegeneral = "กรุณากรอกชื่อสถาบันศึกษาทั่วไป";
                validate = true;
            }
            if (!c.schoolNameDemonstration && c.schoolType === 'สาธิตพิบูลบำเพ็ญ') {
                isError.value[index].schoolNameDemonstration = "กรุณาเลือกชื่อสถาบันศึกษา";
                validate = true;
            }
            if (!c.district) {
                isError.value[index].district = "กรุณากรอกอำเภอ";
                validate = true;
            }
            if (!c.province) {
                isError.value[index].province = "กรุณากรอกจังหวัด";
                validate = true;
            }
            if (!c.subCategoriesId) {
                isError.value[index].subCategoriesId = "กรุณาเลือกกระดับชั้นที่ศึกษา";
                validate = true;
            }

            if (c.childPassedAway) {
                if (!c.delegateNumber) {
                    isError.value[index].delegateNumber = "กรุณาเลือกลำดับบุตรแทนที่";
                    validate = true;
                }
                if (!c.delegateDeathDay) {
                    isError.value[index].delegateDeathDay = "กรุณาเลือกวันที่ถึงแก่กรรม";
                    validate = true;
                }

            }
        });
    }

    if (validate) {
        Notify.create({
            message: "กรุณากรอกข้อมูลให้ครบถ้วน",
            position: "bottom-left",
            type: "negative",
        });
        return;
    }


    let isValid = false;

    let payload = {
        prefix: model.value.prefix,
        fundSumReceipt: model.value.fundSumReceipt,
        fundEligible: model.value.fundEligible,
        actionId: actionId ?? null,
        spouse: model.value.spouse,
        marryRegis: model.value.marryRegis,
        parentalStatus: model.value.parentalStatus,
        role: model.value.role,
        eligible: model.value.eligible,
        position: spouseData.value.officer?.position || spouseData.value.enterprises?.position,
        department: spouseData.value.officer?.department || spouseData.value.enterprises?.department,
        eligibleBenefits: model.value.eligibleBenefits[0] ?? null,
        eligibleSubSenefits: model.value.eligibleSubSenefits[1] ?? null,
        deleteChild: model.value.deleteChild?.filter(c => c.id !== null) || [],
        child: model.value.child.map(c => {
            let childData = {
                id: c.id,
                fundReceipt: c.fundReceipt,
                fundEligible: c.fundEligible,
                fundOther: c.fundOther ?? 0,
                childName: c.childName,
                childNumber: c.childNumber,
                fundUniversity: c.fundUniversity ?? 0,
                fundSubUniversity: c.fundSubUniversity ?? 0,
                childBirthDay: formatDateServer(c.childBirthDay),
                childFatherNumber: c.childFatherNumber,
                childMotherNumber: c.childMotherNumber,
                schoolName: c.schoolNamegeneral ?? c.schoolNameDemonstration ?? null, // ✅ ป้องกัน undefined
                schoolType: c.schoolType,
                district: c.district,
                province: c.province,
                subCategoriesId: c.subCategoriesId,
                childPassedAway: c.childPassedAway
            };

            if (c.childPassedAway) {
                childData.delegateName = c.delegateName ?? null;
                childData.delegateNumber = c.delegateNumber ?? null;
                childData.delegateBirthDay = c.delegateBirthDay ?? null;
                childData.delegateDeathDay = c.delegateDeathDay ?? null;
            }

            return childData;
        })
    };



    let fetch; // เปลี่ยนจาก var เป็น let
    Swal.fire({
        title: "ยืนยันการทำรายการหรือไม่ ???",
        html: `โปรดตรวจสอบข้อมูลให้แน่ใจก่อนยืนยัน`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "ยืนยัน",
        cancelButtonText: "ยกเลิก",
        showLoaderOnConfirm: true,
        reverseButtons: true,
        customClass: {
            confirmButton: "save-button",
            cancelButton: "cancel-button",
        },
        preConfirm: async () => {
            try {
                if (isEdit.value) {
                    fetch = await welfareManagementService.updateChildren(route.params.id, payload);
                    await uploadFiles(route.params.id);
                } else {
                    fetch = await reimbursementChildrenEducationService.create(payload);
                    const newId = fetch?.data?.newItem?.id;
                    if (newId) await uploadFiles(newId);
                }
                isValid = true;
            } catch (error) {
                if (error?.response?.status == 400) {
                    if (Object.keys(error?.response?.data?.errors ?? {}).length) {
                        isError.value = {
                            ...isError.value,
                            ...error.response?.data?.errors,
                        };
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
                html: fetch?.data?.message ?? `สำเร็จ`,
                icon: "success",
                confirmButtonText: "ตกลง",
                customClass: {
                    confirmButton: "save-button",
                },
            }).then(() => {
                router.replace({ name: "welfare_management_list" });
            });
        }
    });
}


async function init() {
    isView.value = route.meta.isView;
    isLoading.value = true;
    try {
        if (isView.value) {
            fetchDataEdit();
        }
        else if (isEdit.value) {
            fetchRemaining();
            const result = await userManagementService.getUserInitialData({ keyword: null });
            userInitialData.value = result.data.datas;
            optionsUserName.value = result.data.datas;
            fetchDataEdit();
            fetchRemaining();
            fetchTotalCountRequested();
        }
        else {
            const result = await userManagementService.getUserInitialData({ keyword: null });
            userInitialData.value = result.data.datas;
            fetchRemaining();
            fetchTotalCountRequested();
        }
    }
    catch (error) {
        Promise.reject(error);
    }
    isLoading.value = false;
}
</script>
<style scoped>
.text {
    white-space: pre-line;
}

:deep(.no-border) .q-field__control:before,
:deep(.no-border) .q-field__control:after {
    display: none !important;
}
</style>