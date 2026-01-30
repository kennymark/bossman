import type { FormikProps } from 'formik'
import { Checkbox, HStack, SimpleGrid, Stack, Switch } from '@/components/ui'
import type { CreateCustomerFormValues } from '../create-form'
import pageTree from '../data'

function PageOptions({ formik }: { formik: FormikProps<CreateCustomerFormValues> }) {
  return (
    <SimpleGrid cols={3}>
      {pageTree.map((page) => (
        <Stack key={page.label} spacing={2}>
          <Stack>
            <Switch
              disabled={page.isRequired}
              checked={
                formik.values.pages.orgPages.find((p: any) => p.label === page.label)?.isEnabled ??
                false
              }
              onChange={(e) => {
                const state = e.target.checked
                const index = pageTree.findIndex((p) => p.label === page.label)

                formik.setFieldValue(`pages.orgPages[${index}].isEnabled`, state)
                if (!state) {
                  // disable all children
                  formik.setFieldValue(`pages.orgPages[${index}].children`, [])
                } else {
                  // enable all children
                  formik.setFieldValue(`pages.orgPages[${index}].children`, page.children)
                }
              }}>
              {page.label}
            </Switch>
          </Stack>
          {page.children && (
            <Stack spacing={2}>
              {page.children.map(
                (child) =>
                  child && (
                    <HStack key={child} spacing={2} align='center'>
                      <Checkbox
                        checked={
                          formik.values.pages.orgPages
                            .find((p: any) => p.label === page.label)
                            ?.children?.includes(child) ?? false
                        }
                        onChange={(e) => {
                          const state = e.target.checked
                          const index = pageTree.findIndex((p) => p.label === page.label)
                          const currentChildren = formik.values.pages.orgPages[index].children

                          formik.setFieldValue(
                            `pages.orgPages[${index}].children`,
                            state
                              ? [...(currentChildren ?? []), child]
                              : (currentChildren ?? []).filter((c: string) => c !== child),
                          )
                        }}
                      />
                      <p>{child}</p>
                    </HStack>
                  ),
              )}
            </Stack>
          )}
        </Stack>
      ))}
    </SimpleGrid>
  )
}

export default PageOptions
