import Joi from "joi";

export const chatSchema = Joi.object({
  chat: Joi.array()
    .items(
      Joi.object({
        role: Joi.string().valid("user", "assistant", "system").required(),
        content: Joi.alternatives()
          .try(
            Joi.string().min(1),
            Joi.array().items(
              Joi.object({
                type: Joi.string().valid("text").required(),
                text: Joi.string().min(1).required(),
              })
            )
          )
          .required(),
      })
    )
    .min(1)
    .required(),
});
