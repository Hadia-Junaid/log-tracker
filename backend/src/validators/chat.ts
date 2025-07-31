import Joi from "joi";

export const chatSchema = Joi.object({
  chat: Joi.array()
    .items(
      Joi.object({
        role: Joi.string().valid("user", "model").required(),
        parts: Joi.array()
          .items(
            Joi.object({
              text: Joi.string().min(1).required(),
            })
          )
          .min(1)
          .required(),
      })
    )
    .min(1)
    .required(),
});
